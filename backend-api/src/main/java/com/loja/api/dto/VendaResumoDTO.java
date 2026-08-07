package com.loja.api.dto;

import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.StatusVenda;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VendaResumoDTO(
        Long id,
        LocalDateTime dataVenda,
        BigDecimal valorTotal,
        BigDecimal desconto,
        Long clienteId,
        String clienteNome,
        FormaPagamento formaPagamento,
        StatusVenda status,
        LocalDateTime dataCancelamento,
        String motivoCancelamento,
        String canceladoPor
        ) {
}
