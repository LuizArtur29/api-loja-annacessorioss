package com.loja.api.service;

import com.loja.api.dto.ItemVendaResponseDTO;
import com.loja.api.dto.VendaRequestDTO;
import com.loja.api.dto.VendaResponseDTO;
import com.loja.api.dto.VendaResumoDTO;
import com.loja.api.exception.ResourceNotFoundException;
import com.loja.api.model.Cliente;
import com.loja.api.model.ItemVenda;
import com.loja.api.model.Produto;
import com.loja.api.model.Venda;
import com.loja.api.model.enums.StatusVenda;
import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.TipoMovimentacaoEstoque;
import com.loja.api.repository.ClienteRepository;
import com.loja.api.repository.ProdutoRepository;
import com.loja.api.repository.VendaRepository;
import com.loja.api.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.JoinType;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class VendaService {

        private final VendaRepository vendaRepository;
        private final ProdutoRepository produtoRepository;
        private final ClienteRepository clienteRepository;
        private final MovimentacaoEstoqueService movimentacaoEstoqueService;
        private final CurrentUserProvider currentUserProvider;

        @Transactional(readOnly = true)
        public Page<VendaResumoDTO> listarTodas(String q, StatusVenda status, FormaPagamento formaPagamento,
                        LocalDateTime inicio, LocalDateTime fim, Pageable pageable) {
                String termo = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
                Specification<Venda> filtros = (root, query, criteriaBuilder) -> {
                        var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

                        if (!termo.isBlank()) {
                                var cliente = root.join("cliente", JoinType.LEFT);
                                predicates.add(criteriaBuilder.like(
                                                criteriaBuilder.lower(criteriaBuilder.coalesce(
                                                                cliente.get("nome"), "consumidor final")),
                                                "%" + termo + "%"));
                        }
                        if (status != null) {
                                predicates.add(criteriaBuilder.equal(root.get("status"), status));
                        }
                        if (formaPagamento != null) {
                                predicates.add(criteriaBuilder.equal(root.get("formaPagamento"), formaPagamento));
                        }
                        if (inicio != null) {
                                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("dataVenda"), inicio));
                        }
                        if (fim != null) {
                                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("dataVenda"), fim));
                        }

                        return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
                };

                return vendaRepository.findAll(filtros, pageable)
                                .map(this::toResumoDTO);
        }

        @Transactional(readOnly = true)
        public VendaResponseDTO buscarPorId(Long id) {
                Venda venda = vendaRepository.findDetailedById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Venda não encontrada com id: " + id));
                return toResponseDTO(venda);
        }

        @Transactional
        public VendaResponseDTO registrar(VendaRequestDTO dto) {
                Venda venda = new Venda();

                if (dto.clienteId() != null) {
                        Cliente cliente = clienteRepository.findByIdAndAtivoTrue(dto.clienteId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Cliente não encontrado com id: " + dto.clienteId()));
                        venda.setCliente(cliente);
                }

                venda.setFormaPagamento(dto.formaPagamento());

                BigDecimal valorTotal = BigDecimal.ZERO;

                var produtosInformados = new HashSet<Long>();
                var alteracoesEstoque = new java.util.ArrayList<AlteracaoEstoque>();
                for (var itemDto : dto.itens()) {
                        if (!produtosInformados.add(itemDto.produtoId())) {
                                throw new IllegalArgumentException("Cada produto deve aparecer apenas uma vez na venda.");
                        }
                        Produto produto = produtoRepository.findActiveByIdForUpdate(itemDto.produtoId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Produto não encontrado com id: " + itemDto.produtoId()));

                        if (produto.getQuantidadeEstoque() < itemDto.quantidade()) {
                                throw new IllegalArgumentException(
                                                "Estoque insuficiente para o produto: " + produto.getNome() +
                                                                ". Disponível: " + produto.getQuantidadeEstoque());
                        }

                        ItemVenda item = new ItemVenda();
                        item.setVenda(venda);
                        item.setProduto(produto);
                        item.setQuantidade(itemDto.quantidade());
                        item.setPrecoUnitario(produto.getPrecoVenda());

                        venda.getItens().add(item);

                        valorTotal = valorTotal.add(
                                        produto.getPrecoVenda().multiply(BigDecimal.valueOf(itemDto.quantidade())));

                        int saldoAnterior = produto.getQuantidadeEstoque();
                        produto.setQuantidadeEstoque(saldoAnterior - itemDto.quantidade());
                        produtoRepository.save(produto);
                        alteracoesEstoque.add(new AlteracaoEstoque(produto, -itemDto.quantidade(),
                                        saldoAnterior, produto.getQuantidadeEstoque()));
                }

                // Aplicar desconto
                BigDecimal desconto = dto.desconto() != null ? dto.desconto() : BigDecimal.ZERO;
                if (desconto.compareTo(valorTotal) > 0) {
                        throw new IllegalArgumentException("O desconto não pode ser maior que o valor total da venda.");
                }
                venda.setDesconto(desconto);
                venda.setValorTotal(valorTotal.subtract(desconto));

                venda.setStatus(StatusVenda.ATIVA);
                venda = vendaRepository.save(venda);

                for (AlteracaoEstoque alteracao : alteracoesEstoque) {
                        movimentacaoEstoqueService.registrar(alteracao.produto(), venda, TipoMovimentacaoEstoque.VENDA,
                                        alteracao.quantidade(), alteracao.saldoAnterior(), alteracao.saldoPosterior(),
                                        "Venda #" + venda.getId());
                }

                return toResponseDTO(venda);
        }

        @Transactional
        public void cancelar(Long id, String motivo) {
                Venda venda = vendaRepository.findByIdForUpdate(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Venda não encontrada com id: " + id));

                if (venda.getStatus() == StatusVenda.CANCELADA) {
                        return;
                }

                for (ItemVenda item : venda.getItens()) {
                        Produto produto = produtoRepository.findByIdForUpdate(item.getProduto().getId())
                                        .orElseThrow(() -> new IllegalStateException("Produto histórico da venda não encontrado"));
                        int saldoAnterior = produto.getQuantidadeEstoque();
                        produto.setQuantidadeEstoque(saldoAnterior + item.getQuantidade());
                        produtoRepository.save(produto);
                        movimentacaoEstoqueService.registrar(produto, venda,
                                        TipoMovimentacaoEstoque.CANCELAMENTO_VENDA, item.getQuantidade(),
                                        saldoAnterior, produto.getQuantidadeEstoque(), motivo.trim());
                }

                venda.setStatus(StatusVenda.CANCELADA);
                venda.setDataCancelamento(LocalDateTime.now());
                venda.setMotivoCancelamento(motivo.trim());
                venda.setCanceladoPor(currentUserProvider.username());
                vendaRepository.save(venda);
        }

        private VendaResponseDTO toResponseDTO(Venda venda) {
                List<ItemVendaResponseDTO> itens = venda.getItens().stream()
                                .map(item -> new ItemVendaResponseDTO(
                                                item.getId(),
                                                item.getProduto().getId(),
                                                item.getProduto().getNome(),
                                                item.getQuantidade(),
                                                item.getPrecoUnitario(),
                                                item.getPrecoUnitario()
                                                                .multiply(BigDecimal.valueOf(item.getQuantidade()))))
                                .toList();

                return new VendaResponseDTO(
                                venda.getId(),
                                venda.getDataVenda(),
                                venda.getValorTotal(),
                                venda.getDesconto(),
                                venda.getCliente() != null ? venda.getCliente().getId() : null,
                                venda.getCliente() != null ? venda.getCliente().getNome() : "Consumidor Final",
                                venda.getFormaPagamento(),
                                venda.getStatus(),
                                venda.getDataCancelamento(),
                                venda.getMotivoCancelamento(),
                                venda.getCanceladoPor(),
                                itens);
        }

        private VendaResumoDTO toResumoDTO(Venda venda) {
                return new VendaResumoDTO(
                        venda.getId(),
                        venda.getDataVenda(),
                        venda.getValorTotal(),
                        venda.getDesconto(),
                        venda.getCliente() != null ? venda.getCliente().getId() : null,
                        venda.getCliente() != null ? venda.getCliente().getNome() : "Consumidor Final",
                        venda.getFormaPagamento(),
                        venda.getStatus(),
                        venda.getDataCancelamento(),
                        venda.getMotivoCancelamento(),
                        venda.getCanceladoPor()
                );
        }

        private record AlteracaoEstoque(Produto produto, int quantidade, int saldoAnterior, int saldoPosterior) {
        }
}
