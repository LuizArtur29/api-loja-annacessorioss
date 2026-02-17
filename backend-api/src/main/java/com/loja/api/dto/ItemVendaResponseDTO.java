package com.loja.api.dto;

import java.math.BigDecimal;

public record ItemVendaResponseDTO(
        Long id,
        Long produtoId,
        String produtoNome,
        Integer quantidade,
        BigDecimal precoUnitario,
        BigDecimal subtotal) {
}
