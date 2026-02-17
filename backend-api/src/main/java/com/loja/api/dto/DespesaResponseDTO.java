package com.loja.api.dto;

import com.loja.api.model.Despesa;
import com.loja.api.model.enums.CategoriaDespesa;
import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.StatusPagamento;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DespesaResponseDTO(
        Long id,
        String descricao,
        BigDecimal valor,
        LocalDate dataPagamento,
        CategoriaDespesa categoria,
        StatusPagamento status,
        FormaPagamento formaPagamento,
        String observacoes) {

    public DespesaResponseDTO(Despesa despesa) {
        this(despesa.getId(),
                despesa.getDescricao(),
                despesa.getValor(),
                despesa.getDataPagamento(),
                despesa.getCategoria(),
                despesa.getStatus(),
                despesa.getFormaPagamento(),
                despesa.getObservacoes());
    }
}