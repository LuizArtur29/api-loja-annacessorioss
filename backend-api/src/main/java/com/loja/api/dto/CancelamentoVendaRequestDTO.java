package com.loja.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelamentoVendaRequestDTO(
        @NotBlank(message = "O motivo do cancelamento é obrigatório")
        @Size(max = 255, message = "O motivo deve ter no máximo 255 caracteres") String motivo) {
}
