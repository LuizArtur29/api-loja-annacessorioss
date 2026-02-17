package com.loja.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DespesaRequestDTO(String descricao, BigDecimal valor, LocalDate dataPagamento) {
}