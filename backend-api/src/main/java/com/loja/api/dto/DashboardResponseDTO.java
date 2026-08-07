package com.loja.api.dto;

import com.loja.api.model.enums.CategoriaDespesa;
import com.loja.api.model.enums.FormaPagamento;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardResponseDTO(
        BigDecimal totalEntradas,
        BigDecimal totalSaidas,
        BigDecimal totalPendentes,
        BigDecimal saldoLiquido,
        long quantidadeVendas,
        Map<CategoriaDespesa, BigDecimal> despesasPorCategoria,
        Map<FormaPagamento, Long> vendasPorFormaPagamento) {
}
