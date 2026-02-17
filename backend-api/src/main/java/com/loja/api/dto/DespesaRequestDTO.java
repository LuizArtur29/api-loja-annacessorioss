package com.loja.api.dto;

import com.loja.api.model.Categoria;
import com.loja.api.model.enums.CategoriaDespesa;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DespesaRequestDTO(String descricao, BigDecimal valor, LocalDate dataPagamento, CategoriaDespesa categoria) {
}