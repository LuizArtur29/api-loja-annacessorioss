package com.loja.api.service;

import com.loja.api.dto.MovimentacaoEstoqueResponseDTO;
import com.loja.api.model.MovimentacaoEstoque;
import com.loja.api.model.Produto;
import com.loja.api.model.Venda;
import com.loja.api.model.enums.TipoMovimentacaoEstoque;
import com.loja.api.repository.MovimentacaoEstoqueRepository;
import com.loja.api.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MovimentacaoEstoqueService {

    private final MovimentacaoEstoqueRepository repository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public void registrar(Produto produto, Venda venda, TipoMovimentacaoEstoque tipo,
                          int quantidade, int saldoAnterior, int saldoPosterior, String motivo) {
        if (saldoPosterior - saldoAnterior != quantidade) {
            throw new IllegalArgumentException("A movimentação de estoque não fecha com os saldos informados.");
        }

        MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
        movimentacao.setProduto(produto);
        movimentacao.setVenda(venda);
        movimentacao.setTipo(tipo);
        movimentacao.setQuantidade(quantidade);
        movimentacao.setSaldoAnterior(saldoAnterior);
        movimentacao.setSaldoPosterior(saldoPosterior);
        movimentacao.setMotivo(motivo);
        movimentacao.setResponsavel(currentUserProvider.username());
        repository.save(movimentacao);
    }

    @Transactional(readOnly = true)
    public Page<MovimentacaoEstoqueResponseDTO> listarPorProduto(Long produtoId, Pageable pageable) {
        return repository.findByProdutoId(produtoId, pageable).map(this::toResponse);
    }

    private MovimentacaoEstoqueResponseDTO toResponse(MovimentacaoEstoque movimentacao) {
        return new MovimentacaoEstoqueResponseDTO(
                movimentacao.getId(),
                movimentacao.getProduto().getId(),
                movimentacao.getVenda() == null ? null : movimentacao.getVenda().getId(),
                movimentacao.getTipo(),
                movimentacao.getQuantidade(),
                movimentacao.getSaldoAnterior(),
                movimentacao.getSaldoPosterior(),
                movimentacao.getMotivo(),
                movimentacao.getResponsavel(),
                movimentacao.getDataMovimentacao());
    }
}
