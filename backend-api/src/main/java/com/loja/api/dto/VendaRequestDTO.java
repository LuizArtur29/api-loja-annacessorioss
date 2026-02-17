package com.loja.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record VendaRequestDTO(
        Long clienteId,

        @NotEmpty(message = "A venda deve conter pelo menos um item") @Valid List<ItemVendaRequestDTO> itens) {
}
