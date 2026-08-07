package com.loja.api.controller;

import com.loja.api.dto.ProdutoRequestDTO;
import com.loja.api.dto.ProdutoResponseDTO;
import com.loja.api.dto.MovimentacaoEstoqueResponseDTO;
import com.loja.api.dto.PageResponse;
import com.loja.api.dto.AjusteEstoqueRequestDTO;
import com.loja.api.dto.ProdutoUpdateRequestDTO;
import com.loja.api.service.MovimentacaoEstoqueService;
import com.loja.api.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    private final ProdutoService service;
    private final MovimentacaoEstoqueService movimentacaoEstoqueService;

    public ProdutoController(ProdutoService service, MovimentacaoEstoqueService movimentacaoEstoqueService) {
        this.service = service;
        this.movimentacaoEstoqueService = movimentacaoEstoqueService;
    }

    @GetMapping("/valor-total")
    public ResponseEntity<BigDecimal> valorTotalEstoque() {
        return ResponseEntity.ok(service.calcularValorTotalEstoque());
    }

    @GetMapping
    public ResponseEntity<PageResponse<ProdutoResponseDTO>> listarTodos(
            @RequestParam(defaultValue = "") String q,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(PageResponse.from(service.listarTodos(q, pageable)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ProdutoResponseDTO>> listarTodosSemPaginacao() {
        return ResponseEntity.ok(service.listarTodosSemPaginacao());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProdutoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/{id}/movimentacoes")
    public ResponseEntity<PageResponse<MovimentacaoEstoqueResponseDTO>> listarMovimentacoes(
            @PathVariable Long id,
            @PageableDefault(size = 20, sort = "dataMovimentacao", direction = org.springframework.data.domain.Sort.Direction.DESC)
            Pageable pageable) {
        service.buscarPorId(id);
        return ResponseEntity.ok(PageResponse.from(movimentacaoEstoqueService.listarPorProduto(id, pageable)));
    }

    @PostMapping
    public ResponseEntity<ProdutoResponseDTO> criar(@Valid @RequestBody ProdutoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProdutoResponseDTO> atualizar(@PathVariable Long id,
            @Valid @RequestBody ProdutoUpdateRequestDTO dto) {
        var resposta = ResponseEntity.ok();
        if (dto.quantidadeEstoque() != null) {
            resposta.header("Deprecation", "true");
        }
        return resposta.body(service.atualizar(id, dto));
    }

    @PostMapping("/{id}/ajustes-estoque")
    public ResponseEntity<ProdutoResponseDTO> ajustarEstoque(
            @PathVariable Long id, @Valid @RequestBody AjusteEstoqueRequestDTO dto) {
        return ResponseEntity.ok(service.ajustarEstoque(id, dto.novoSaldo(), dto.motivo()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
