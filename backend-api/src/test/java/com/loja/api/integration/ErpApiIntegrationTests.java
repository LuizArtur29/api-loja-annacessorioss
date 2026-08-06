package com.loja.api.integration;

import com.jayway.jsonpath.JsonPath;
import com.loja.api.dto.ItemVendaRequestDTO;
import com.loja.api.dto.VendaRequestDTO;
import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.StatusVenda;
import com.loja.api.repository.CategoriaRepository;
import com.loja.api.repository.ClienteRepository;
import com.loja.api.repository.DespesaRepository;
import com.loja.api.repository.ItemVendaRepository;
import com.loja.api.repository.MovimentacaoEstoqueRepository;
import com.loja.api.repository.ProdutoRepository;
import com.loja.api.repository.VendaRepository;
import com.loja.api.service.VendaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@AutoConfigureMockMvc
@SpringBootTest(properties = {
        "springdotenv.enabled=false",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "springdoc.api-docs.enabled=true",
        "springdoc.swagger-ui.enabled=true",
        "jwt.secret=SW50ZWdyYXRpb24tdGVzdC1zZWNyZXQtdGhhdC1pcy1sb25nLWVub3VnaC0xMjM0NTY=",
        "app.bootstrap.admin.username=integration-admin",
        "app.bootstrap.admin.password=integration-password-123"
})
class ErpApiIntegrationTests {

    private static final String ADMIN_USERNAME = "integration-admin";
    private static final String ADMIN_PASSWORD = "integration-password-123";

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine")
            .withDatabaseName("anna_erp_integration")
            .withUsername("anna_test")
            .withPassword("anna_test");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private VendaService vendaService;

    @Autowired
    private ItemVendaRepository itemVendaRepository;

    @Autowired
    private MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private DespesaRepository despesaRepository;

    @BeforeEach
    void limparDadosDeNegocio() {
        movimentacaoEstoqueRepository.deleteAllInBatch();
        itemVendaRepository.deleteAllInBatch();
        vendaRepository.deleteAllInBatch();
        produtoRepository.deleteAllInBatch();
        categoriaRepository.deleteAllInBatch();
        clienteRepository.deleteAllInBatch();
        despesaRepository.deleteAllInBatch();
    }

    @Test
    void deveExecutarMigrationEValidarSchemaRealDoPostgresql() {
        Integer migrations = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where version = '1' and success",
                Integer.class);
        String produtos = jdbcTemplate.queryForObject(
                "select to_regclass('public.produtos')::text",
                String.class);

        assertThat(migrations).isEqualTo(1);
        assertThat(produtos).isEqualTo("produtos");
    }

    @Test
    void devePublicarContratoOpenApiQuandoExplicitamenteHabilitado() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("ERP Ana Acessórios API"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.type").value("http"));
    }

    @Test
    void deveAutenticarERejeitarSenhaInvalida() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_USERNAME, "senha-incorreta")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuário ou senha inválidos"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_USERNAME, ADMIN_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value(ADMIN_USERNAME));
    }

    @Test
    void deveProtegerEndpointsEPadronizarErroDeAutenticacao() throws Exception {
        mockMvc.perform(get("/api/produtos"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"))
                .andExpect(jsonPath("$.message").value("Autenticação necessária"))
                .andExpect(jsonPath("$.path").value("/api/produtos"));
    }

    @Test
    void deveRetornarCamposInvalidosEmContratoEstavel() throws Exception {
        String token = autenticar();

        mockMvc.perform(post("/api/produtos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"", "precoVenda":0, "quantidadeEstoque":-1}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.path").value("/api/produtos"))
                .andExpect(jsonPath("$.fields.nome").exists())
                .andExpect(jsonPath("$.fields.precoVenda").exists())
                .andExpect(jsonPath("$.fields.quantidadeEstoque").exists())
                .andExpect(jsonPath("$.fields.categoriaId").exists());
    }

    @Test
    void deveRegistrarCancelarVendaEDevolverEstoqueUmaUnicaVez() throws Exception {
        String token = autenticar();
        long categoriaId = criarCategoria(token, "Brincos");
        long produtoId = criarProduto(token, categoriaId, "Brinco Dourado", "9.90", 3);

        String venda = registrarVenda(token, produtoId, 2, "0.00");
        long vendaId = id(venda);

        assertThat(produtoRepository.findById(produtoId).orElseThrow().getQuantidadeEstoque()).isEqualTo(1);
        assertThat(vendaRepository.findById(vendaId).orElseThrow().getStatus()).isEqualTo(StatusVenda.ATIVA);

        mockMvc.perform(delete("/api/vendas/{id}", vendaId).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/vendas/{id}", vendaId).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());

        assertThat(produtoRepository.findById(produtoId).orElseThrow().getQuantidadeEstoque()).isEqualTo(3);
        assertThat(vendaRepository.findById(vendaId).orElseThrow().getStatus()).isEqualTo(StatusVenda.CANCELADA);
        assertThat(movimentacaoEstoqueRepository.findAll())
                .extracting(movimentacao -> movimentacao.getTipo().name())
                .containsExactly("ESTOQUE_INICIAL", "VENDA", "CANCELAMENTO_VENDA");
    }

    @Test
    void deveRejeitarVendaSemEstoqueSemPersistirAlteracoes() throws Exception {
        String token = autenticar();
        long categoriaId = criarCategoria(token, "Colares");
        long produtoId = criarProduto(token, categoriaId, "Colar", "25.00", 1);

        mockMvc.perform(post("/api/vendas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vendaJson(produtoId, 2, "0.00")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Estoque insuficiente")));

        assertThat(produtoRepository.findById(produtoId).orElseThrow().getQuantidadeEstoque()).isEqualTo(1);
        assertThat(vendaRepository.count()).isZero();
    }

    @Test
    void deveRegistrarAjusteManualEListarHistoricoDoProduto() throws Exception {
        String token = autenticar();
        long categoriaId = criarCategoria(token, "Tiaras");
        long produtoId = criarProduto(token, categoriaId, "Tiara", "30.00", 2);

        mockMvc.perform(put("/api/produtos/{id}", produtoId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome":"Tiara Premium",
                                  "codigo":" T-1 ",
                                  "descricao":" ",
                                  "precoVenda":35.00,
                                  "quantidadeEstoque":5,
                                  "categoriaId":%d
                                }
                                """.formatted(categoriaId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value("T-1"))
                .andExpect(jsonPath("$.descricao").doesNotExist());

        mockMvc.perform(get("/api/produtos/{id}/movimentacoes", produtoId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].tipo").value("AJUSTE_MANUAL"))
                .andExpect(jsonPath("$.content[0].quantidade").value(3))
                .andExpect(jsonPath("$.content[0].saldoAnterior").value(2))
                .andExpect(jsonPath("$.content[0].saldoPosterior").value(5));
    }

    @Test
    void deveImpedirInativacaoDeCategoriaComProdutoAtivo() throws Exception {
        String token = autenticar();
        long categoriaId = criarCategoria(token, "Bolsas");
        criarProduto(token, categoriaId, "Bolsa", "80.00", 1);

        mockMvc.perform(delete("/api/categorias/{id}", categoriaId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATION"))
                .andExpect(jsonPath("$.message").value(
                        "Não é possível inativar uma categoria com produtos ativos."));
    }

    @Test
    void deveInativarClienteSemApagarRegistroHistorico() throws Exception {
        String token = autenticar();
        String cliente = mockMvc.perform(post("/api/clientes")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"  Maria  \",\"telefone\":\" 81999990000 \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Maria"))
                .andReturn().getResponse().getContentAsString();
        long clienteId = id(cliente);

        mockMvc.perform(delete("/api/clientes/{id}", clienteId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/clientes/{id}", clienteId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));

        assertThat(clienteRepository.findById(clienteId)).isPresent();
        assertThat(clienteRepository.findById(clienteId).orElseThrow().isAtivo()).isFalse();
    }

    @Test
    void devePreservarTotalExatoAoParcelarDespesa() throws Exception {
        String token = autenticar();

        mockMvc.perform(post("/api/despesas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "descricao": "Compra de embalagens",
                                  "valor": 100.00,
                                  "dataPagamento": "2026-08-10",
                                  "categoria": "EMBALAGEM",
                                  "status": "PENDENTE",
                                  "formaPagamento": "PIX",
                                  "parcelas": 3
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(3));

        var parcelas = despesaRepository.findAll();
        BigDecimal total = parcelas.stream()
                .map(despesa -> despesa.getValor())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(parcelas).hasSize(3);
        assertThat(total).isEqualByComparingTo("100.00");
        assertThat(parcelas).extracting(despesa -> despesa.getValor())
                .containsExactlyInAnyOrder(new BigDecimal("33.33"), new BigDecimal("33.33"), new BigDecimal("33.34"));
    }

    @Test
    void dashboardDeveDesconsiderarVendaCancelada() throws Exception {
        String token = autenticar();
        YearMonth periodo = YearMonth.now();
        long categoriaId = criarCategoria(token, "Pulseiras");
        long produtoId = criarProduto(token, categoriaId, "Pulseira", "100.00", 2);
        long vendaId = id(registrarVenda(token, produtoId, 1, "0.00"));

        mockMvc.perform(post("/api/despesas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "descricao": "Embalagens",
                                  "valor": 40.00,
                                  "dataPagamento": "%s",
                                  "categoria": "EMBALAGEM",
                                  "status": "PAGO",
                                  "formaPagamento": "PIX",
                                  "parcelas": 1
                                }
                                """.formatted(periodo.atDay(10))))
                .andExpect(status().isCreated());

        String antes = mockMvc.perform(get("/api/dashboard")
                        .param("ano", String.valueOf(periodo.getYear()))
                        .param("mes", String.valueOf(periodo.getMonthValue()))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertDecimal(antes, "$.totalEntradas", "100.00");
        assertDecimal(antes, "$.totalSaidas", "40.00");
        assertDecimal(antes, "$.saldoLiquido", "60.00");

        mockMvc.perform(delete("/api/vendas/{id}", vendaId).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());

        String depois = mockMvc.perform(get("/api/dashboard")
                        .param("ano", String.valueOf(periodo.getYear()))
                        .param("mes", String.valueOf(periodo.getMonthValue()))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertDecimal(depois, "$.totalEntradas", "0.00");
        assertDecimal(depois, "$.totalSaidas", "40.00");
        assertDecimal(depois, "$.saldoLiquido", "-40.00");
    }

    @Test
    void deveSerializarDuasVendasConcorrentesDoUltimoItemEmEstoque() throws Exception {
        String token = autenticar();
        long categoriaId = criarCategoria(token, "Anéis");
        long produtoId = criarProduto(token, categoriaId, "Anel Único", "50.00", 1);
        var requisicao = new VendaRequestDTO(
                null,
                FormaPagamento.PIX,
                BigDecimal.ZERO,
                List.of(new ItemVendaRequestDTO(produtoId, 1)));

        var prontas = new CountDownLatch(2);
        var iniciar = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);

        try {
            var chamadas = List.of(
                    executor.submit(() -> tentarRegistrar(requisicao, prontas, iniciar)),
                    executor.submit(() -> tentarRegistrar(requisicao, prontas, iniciar)));

            assertThat(prontas.await(5, TimeUnit.SECONDS)).isTrue();
            iniciar.countDown();

            long sucessos = 0;
            for (var chamada : chamadas) {
                if (chamada.get(10, TimeUnit.SECONDS)) {
                    sucessos++;
                }
            }

            assertThat(sucessos).isEqualTo(1);
            assertThat(vendaRepository.count()).isEqualTo(1);
            assertThat(produtoRepository.findById(produtoId).orElseThrow().getQuantidadeEstoque()).isZero();
        } finally {
            iniciar.countDown();
            executor.shutdownNow();
        }
    }

    private boolean tentarRegistrar(VendaRequestDTO requisicao, CountDownLatch prontas, CountDownLatch iniciar)
            throws InterruptedException {
        prontas.countDown();
        iniciar.await(5, TimeUnit.SECONDS);
        try {
            vendaService.registrar(requisicao);
            return true;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private String autenticar() throws Exception {
        String resposta = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_USERNAME, ADMIN_PASSWORD)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.token");
    }

    private long criarCategoria(String token, String nome) throws Exception {
        String resposta = mockMvc.perform(post("/api/categorias")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"%s\"}".formatted(nome)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return id(resposta);
    }

    private long criarProduto(String token, long categoriaId, String nome, String preco, int estoque)
            throws Exception {
        String resposta = mockMvc.perform(post("/api/produtos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "%s",
                                  "codigo": "TESTE-%d",
                                  "precoVenda": %s,
                                  "quantidadeEstoque": %d,
                                  "categoriaId": %d
                                }
                                """.formatted(nome, categoriaId, preco, estoque, categoriaId)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return id(resposta);
    }

    private String registrarVenda(String token, long produtoId, int quantidade, String desconto) throws Exception {
        return mockMvc.perform(post("/api/vendas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vendaJson(produtoId, quantidade, desconto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ATIVA"))
                .andReturn().getResponse().getContentAsString();
    }

    private String vendaJson(long produtoId, int quantidade, String desconto) {
        return """
                {
                  "formaPagamento": "PIX",
                  "desconto": %s,
                  "itens": [{"produtoId": %d, "quantidade": %d}]
                }
                """.formatted(desconto, produtoId, quantidade);
    }

    private String loginJson(String username, String password) {
        return "{\"username\":\"%s\",\"senha\":\"%s\"}".formatted(username, password);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private long id(String json) {
        return ((Number) JsonPath.read(json, "$.id")).longValue();
    }

    private void assertDecimal(String json, String path, String expected) {
        Number value = JsonPath.read(json, path);
        assertThat(new BigDecimal(value.toString())).isEqualByComparingTo(expected);
    }
}
