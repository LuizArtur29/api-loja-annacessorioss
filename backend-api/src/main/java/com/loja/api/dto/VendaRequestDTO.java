package com.loja.api.dto;

import com.loja.api.model.enums.FormaPagamento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;

public record VendaRequestDTO(
        Long clienteId,
        FormaPagamento formaPagamento,
        BigDecimal desconto,

        @NotEmpty(message = "A venda deve conter pelo menos um item") @Valid List<ItemVendaRequestDTO> itens) {
}
