package com.loja.api.service;

import com.loja.api.dto.ItemVendaRequestDTO;
import com.loja.api.dto.VendaRequestDTO;
import com.loja.api.model.ItemVenda;
import com.loja.api.model.Produto;
import com.loja.api.model.Venda;
import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.StatusVenda;
import com.loja.api.repository.ClienteRepository;
import com.loja.api.repository.ProdutoRepository;
import com.loja.api.repository.VendaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VendaServiceTests {

    private VendaRepository vendaRepository;
    private ProdutoRepository produtoRepository;
    private MovimentacaoEstoqueService movimentacaoEstoqueService;
    private VendaService service;

    @BeforeEach
    void setUp() {
        vendaRepository = mock(VendaRepository.class);
        produtoRepository = mock(ProdutoRepository.class);
        movimentacaoEstoqueService = mock(MovimentacaoEstoqueService.class);
        service = new VendaService(vendaRepository, produtoRepository, mock(ClienteRepository.class),
                movimentacaoEstoqueService);
        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void saleCalculatesTotalAndDecrementsStock() {
        Produto produto = produto(10L, "Brinco", "25.00", 10);
        when(produtoRepository.findActiveByIdForUpdate(10L)).thenReturn(Optional.of(produto));

        var response = service.registrar(new VendaRequestDTO(
                null,
                FormaPagamento.PIX,
                new BigDecimal("5.00"),
                List.of(new ItemVendaRequestDTO(10L, 2))));

        assertEquals(new BigDecimal("45.00"), response.valorTotal());
        assertEquals(8, produto.getQuantidadeEstoque());
        assertEquals(StatusVenda.ATIVA, response.status());
    }

    @Test
    void insufficientStockDoesNotPersistSale() {
        Produto produto = produto(10L, "Brinco", "25.00", 1);
        when(produtoRepository.findActiveByIdForUpdate(10L)).thenReturn(Optional.of(produto));

        assertThrows(IllegalArgumentException.class, () -> service.registrar(new VendaRequestDTO(
                null,
                FormaPagamento.PIX,
                BigDecimal.ZERO,
                List.of(new ItemVendaRequestDTO(10L, 2)))));

        verify(vendaRepository, never()).save(any());
        assertEquals(1, produto.getQuantidadeEstoque());
    }

    @Test
    void cancellationReturnsStockOnlyOnce() {
        Produto produto = produto(10L, "Brinco", "25.00", 8);
        ItemVenda item = new ItemVenda();
        item.setProduto(produto);
        item.setQuantidade(2);

        Venda venda = new Venda();
        venda.setStatus(StatusVenda.ATIVA);
        venda.getItens().add(item);

        when(vendaRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(venda));
        when(produtoRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(produto));

        service.cancelar(1L);
        service.cancelar(1L);

        assertEquals(10, produto.getQuantidadeEstoque());
        assertEquals(StatusVenda.CANCELADA, venda.getStatus());
        verify(produtoRepository, times(1)).save(produto);
        verify(movimentacaoEstoqueService, times(1)).registrar(
                eq(produto), eq(venda), any(), eq(2), eq(8), eq(10), anyString());
    }

    private Produto produto(Long id, String nome, String preco, int estoque) {
        Produto produto = new Produto();
        produto.setId(id);
        produto.setNome(nome);
        produto.setPrecoVenda(new BigDecimal(preco));
        produto.setQuantidadeEstoque(estoque);
        return produto;
    }
}
