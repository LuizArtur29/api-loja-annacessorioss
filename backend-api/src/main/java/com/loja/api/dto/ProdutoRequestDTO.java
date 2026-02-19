package com.loja.api.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProdutoRequestDTO(
                @NotBlank(message = "O nome do produto é obrigatório") @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres") String nome,

                String codigo,

                String descricao,

                @NotNull(message = "O preço de venda é obrigatório") @DecimalMin(value = "0.01", message = "O preço deve ser maior que zero") BigDecimal precoVenda,

                @NotNull(message = "A quantidade em estoque é obrigatória") @Min(value = 0, message = "A quantidade não pode ser negativa") Integer quantidadeEstoque,

                @NotNull(message = "A categoria é obrigatória") Long categoriaId) {
}
