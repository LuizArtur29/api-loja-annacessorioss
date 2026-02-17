package com.loja.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ItemVendaRequestDTO(
        @NotNull(message = "O produto é obrigatório") Long produtoId,

        @NotNull(message = "A quantidade é obrigatória") @Min(value = 1, message = "A quantidade deve ser no mínimo 1") Integer quantidade) {
}
