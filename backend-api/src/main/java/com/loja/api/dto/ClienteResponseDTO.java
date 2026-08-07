package com.loja.api.dto;

import java.time.LocalDate;

public record ClienteResponseDTO(
        Long id,
        String nome,
        String telefone,
        LocalDate dataNascimento) {
}
