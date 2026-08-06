package com.loja.api.service;

import com.loja.api.dto.ProdutoRequestDTO;
import com.loja.api.dto.ProdutoResponseDTO;
import com.loja.api.exception.ResourceNotFoundException;
import com.loja.api.model.Categoria;
import com.loja.api.model.Produto;
import com.loja.api.model.enums.TipoMovimentacaoEstoque;
import com.loja.api.repository.CategoriaRepository;
import com.loja.api.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final CategoriaRepository categoriaRepository;
    private final MovimentacaoEstoqueService movimentacaoEstoqueService;

    @Transactional(readOnly = true)
    public Page<ProdutoResponseDTO> listarTodos(String q, Pageable pageable) {
        return produtoRepository.searchActive(normalizeQuery(q), pageable)
                .map(this::toResponseDTO);
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponseDTO> listarTodosSemPaginacao() {
        return produtoRepository.findByAtivoTrue().stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProdutoResponseDTO buscarPorId(Long id) {
        Produto produto = produtoRepository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com id: " + id));
        return toResponseDTO(produto);
    }

    @Transactional
    public ProdutoResponseDTO criar(ProdutoRequestDTO dto) {
        Categoria categoria = categoriaRepository.findByIdAndAtivoTrue(dto.categoriaId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Categoria não encontrada com id: " + dto.categoriaId()));

        Produto produto = new Produto();
        produto.setNome(dto.nome().trim());
        produto.setCodigo(normalizeOptional(dto.codigo()));
        produto.setDescricao(normalizeOptional(dto.descricao()));
        produto.setPrecoVenda(dto.precoVenda());
        produto.setQuantidadeEstoque(dto.quantidadeEstoque());
        produto.setCategoria(categoria);

        produto = produtoRepository.save(produto);
        if (produto.getQuantidadeEstoque() > 0) {
            movimentacaoEstoqueService.registrar(produto, null, TipoMovimentacaoEstoque.ESTOQUE_INICIAL,
                    produto.getQuantidadeEstoque(), 0, produto.getQuantidadeEstoque(), "Cadastro do produto");
        }
        return toResponseDTO(produto);
    }

    @Transactional
    public ProdutoResponseDTO atualizar(Long id, ProdutoRequestDTO dto) {
        Produto produto = produtoRepository.findActiveByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com id: " + id));

        Categoria categoria = categoriaRepository.findByIdAndAtivoTrue(dto.categoriaId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Categoria não encontrada com id: " + dto.categoriaId()));

        int saldoAnterior = produto.getQuantidadeEstoque();
        produto.setNome(dto.nome().trim());
        produto.setCodigo(normalizeOptional(dto.codigo()));
        produto.setDescricao(normalizeOptional(dto.descricao()));
        produto.setPrecoVenda(dto.precoVenda());
        produto.setQuantidadeEstoque(dto.quantidadeEstoque());
        produto.setCategoria(categoria);

        produto = produtoRepository.save(produto);
        int diferenca = produto.getQuantidadeEstoque() - saldoAnterior;
        if (diferenca != 0) {
            movimentacaoEstoqueService.registrar(produto, null, TipoMovimentacaoEstoque.AJUSTE_MANUAL,
                    diferenca, saldoAnterior, produto.getQuantidadeEstoque(), "Atualização manual do produto");
        }
        return toResponseDTO(produto);
    }

    @Transactional
    public void deletar(Long id) {
        Produto produto = produtoRepository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com id: " + id));
        produto.setAtivo(false);
        produtoRepository.save(produto);
    }

    @Transactional(readOnly = true)
    public BigDecimal calcularValorTotalEstoque() {
        return produtoRepository.findByAtivoTrue().stream()
                .map(p -> p.getPrecoVenda().multiply(BigDecimal.valueOf(p.getQuantidadeEstoque())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private ProdutoResponseDTO toResponseDTO(Produto produto) {
        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getNome(),
                produto.getCodigo(),
                produto.getDescricao(),
                produto.getPrecoVenda(),
                produto.getQuantidadeEstoque(),
                produto.getCategoria().getId(),
                produto.getCategoria().getNome());
    }

    private String normalizeQuery(String q) {
        return q == null ? "" : q.trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
