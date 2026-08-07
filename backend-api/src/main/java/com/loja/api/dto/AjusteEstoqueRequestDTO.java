package com.loja.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AjusteEstoqueRequestDTO(
        @NotNull(message = "O novo saldo é obrigatório")
        @Min(value = 0, message = "O estoque não pode ser negativo") Integer novoSaldo,
        @NotBlank(message = "O motivo do ajuste é obrigatório")
        @Size(max = 255, message = "O motivo deve ter no máximo 255 caracteres") String motivo) {
}
