package com.loja.api.dto;

import com.loja.api.model.enums.TipoMovimentacaoEstoque;

import java.time.LocalDateTime;

public record MovimentacaoEstoqueResponseDTO(
        Long id,
        Long produtoId,
        Long vendaId,
        TipoMovimentacaoEstoque tipo,
        Integer quantidade,
        Integer saldoAnterior,
        Integer saldoPosterior,
        String motivo,
        LocalDateTime dataMovimentacao) {
}
