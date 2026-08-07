package com.loja.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ClienteRequestDTO(
        @NotBlank(message = "O nome do cliente é obrigatório") @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres") String nome,

        @Size(max = 20, message = "O telefone deve ter no máximo 20 caracteres") String telefone,

        @PastOrPresent(message = "A data de nascimento não pode estar no futuro") LocalDate dataNascimento) {
}
