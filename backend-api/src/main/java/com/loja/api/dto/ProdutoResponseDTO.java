package com.loja.api.dto;

import java.math.BigDecimal;

public record ProdutoResponseDTO(
                Long id,
                String nome,
                String codigo,
                String descricao,
                BigDecimal precoVenda,
                Integer quantidadeEstoque,
                Long categoriaId,
                String categoriaNome) {
}
