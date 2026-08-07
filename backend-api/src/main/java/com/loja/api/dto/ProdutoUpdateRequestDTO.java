package com.loja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProdutoUpdateRequestDTO(
        @NotBlank(message = "O nome do produto é obrigatório")
        @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres") String nome,
        @Size(max = 50, message = "O código deve ter no máximo 50 caracteres") String codigo,
        @Size(max = 5000, message = "A descrição deve ter no máximo 5000 caracteres") String descricao,
        @NotNull(message = "O preço de venda é obrigatório")
        @DecimalMin(value = "0.01", message = "O preço deve ser maior que zero") BigDecimal precoVenda,
        @NotNull(message = "A categoria é obrigatória") Long categoriaId,
        @Schema(description = "Compatibilidade temporária com o frontend anterior; use o endpoint de ajustes de estoque", deprecated = true)
        @Min(value = 0, message = "A quantidade não pode ser negativa") Integer quantidadeEstoque) {

    public ProdutoUpdateRequestDTO(
            String nome,
            String codigo,
            String descricao,
            BigDecimal precoVenda,
            Long categoriaId) {
        this(nome, codigo, descricao, precoVenda, categoriaId, null);
    }
}
