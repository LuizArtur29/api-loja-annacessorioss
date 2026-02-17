package com.loja.api.dto;

import com.loja.api.model.enums.CategoriaDespesa;
import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.StatusPagamento;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DespesaRequestDTO(
        String descricao,
        BigDecimal valor,
        LocalDate dataPagamento,
        CategoriaDespesa categoria,
        StatusPagamento status,
        FormaPagamento formaPagamento,
        String observacoes) {
}