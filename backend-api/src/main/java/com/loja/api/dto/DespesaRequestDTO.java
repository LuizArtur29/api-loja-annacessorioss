package com.loja.api.dto;

import com.loja.api.model.enums.CategoriaDespesa;
import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.StatusPagamento;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DespesaRequestDTO(
        @NotBlank(message = "A descrição é obrigatória") @Size(max = 255, message = "A descrição deve ter no máximo 255 caracteres") String descricao,

        @NotNull(message = "O valor é obrigatório") @Positive(message = "O valor deve ser maior que zero") BigDecimal valor,

        @NotNull(message = "A data de pagamento é obrigatória") LocalDate dataPagamento,

        @NotNull(message = "A categoria é obrigatória") CategoriaDespesa categoria,

        @NotNull(message = "O status é obrigatório") StatusPagamento status,

        FormaPagamento formaPagamento,

        @Size(max = 500, message = "As observações devem ter no máximo 500 caracteres") String observacoes,

        @Min(value = 1, message = "O número de parcelas deve ser no mínimo 1") @Max(value = 48, message = "O número de parcelas deve ser no máximo 48") Integer parcelas) {
}