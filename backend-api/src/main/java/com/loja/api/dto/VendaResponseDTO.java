package com.loja.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VendaResponseDTO(
        Long id,
        LocalDateTime dataVenda,
        BigDecimal valorTotal,
        Long clienteId,
        String clienteNome,
        List<ItemVendaResponseDTO> itens) {
}
