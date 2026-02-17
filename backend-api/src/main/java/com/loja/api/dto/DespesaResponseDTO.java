package com.loja.api.dto;

import com.loja.api.model.Despesa;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DespesaResponseDTO(Long id, String descricao, BigDecimal valor,  LocalDate dataPagamento) {
    public DespesaResponseDTO(Despesa despesa) {
        this(despesa.getId(), despesa.getDescricao(), despesa.getValor(), despesa.getDataPagamento());
    }
}