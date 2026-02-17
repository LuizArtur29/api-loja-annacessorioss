package com.loja.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoriaRequestDTO(
        @NotBlank(message = "O nome da categoria é obrigatório") @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres") String nome) {
}
