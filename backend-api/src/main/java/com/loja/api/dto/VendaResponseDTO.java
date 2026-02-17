package com.loja.api.dto;

import com.loja.api.model.enums.FormaPagamento;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VendaResponseDTO(
                Long id,
                LocalDateTime dataVenda,
                BigDecimal valorTotal,
                Long clienteId,
                String clienteNome,
                FormaPagamento formaPagamento,
                List<ItemVendaResponseDTO> itens) {
}
