package com.loja.api.dto;

import com.loja.api.model.Despesa;
import com.loja.api.model.enums.CategoriaDespesa;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DespesaResponseDTO(Long id, String descricao, BigDecimal valor,  LocalDate dataPagamento, CategoriaDespesa categoria) {
    public DespesaResponseDTO(Despesa despesa) {
        this(despesa.getId(), despesa.getDescricao(), despesa.getValor(), despesa.getDataPagamento(),  despesa.getCategoria());
    }
}