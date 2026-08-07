package com.loja.api.dto;

import com.loja.api.model.enums.FormaPagamento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;

public record VendaRequestDTO(
        Long clienteId,
        @NotNull(message = "A forma de pagamento é obrigatória") FormaPagamento formaPagamento,
        @DecimalMin(value = "0.00", message = "O desconto não pode ser negativo") BigDecimal desconto,

        @NotEmpty(message = "A venda deve conter pelo menos um item") @Valid List<ItemVendaRequestDTO> itens) {
}
