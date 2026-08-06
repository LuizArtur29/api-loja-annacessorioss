package com.loja.api.service;

import com.loja.api.dto.DashboardResponseDTO;
import com.loja.api.model.enums.CategoriaDespesa;
import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.StatusPagamento;
import com.loja.api.model.enums.StatusVenda;
import com.loja.api.repository.DespesaRepository;
import com.loja.api.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.EnumMap;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final VendaRepository vendaRepository;
    private final DespesaRepository despesaRepository;

    @Transactional(readOnly = true)
    public DashboardResponseDTO obterResumo(int ano, int mes) {
        YearMonth periodo = YearMonth.of(ano, mes);
        LocalDateTime inicio = periodo.atDay(1).atStartOfDay();
        LocalDateTime fim = periodo.plusMonths(1).atDay(1).atStartOfDay().minusNanos(1);

        var vendas = vendaRepository.findByDataVendaBetweenAndStatus(inicio, fim, StatusVenda.ATIVA);
        var despesas = despesaRepository.findByAtivoTrueAndDataPagamentoBetween(
                periodo.atDay(1), periodo.atEndOfMonth());

        BigDecimal totalEntradas = vendas.stream()
                .map(venda -> venda.getValorTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSaidas = despesas.stream()
                .filter(despesa -> despesa.getStatus() == StatusPagamento.PAGO)
                .map(despesa -> despesa.getValor())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPendentes = despesas.stream()
                .filter(despesa -> despesa.getStatus() != StatusPagamento.PAGO)
                .map(despesa -> despesa.getValor())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var despesasPorCategoria = new EnumMap<CategoriaDespesa, BigDecimal>(CategoriaDespesa.class);
        despesas.stream()
                .filter(despesa -> despesa.getStatus() == StatusPagamento.PAGO)
                .forEach(despesa -> despesasPorCategoria.merge(
                        despesa.getCategoria(), despesa.getValor(), BigDecimal::add));

        var vendasPorForma = new EnumMap<FormaPagamento, Long>(FormaPagamento.class);
        vendas.stream()
                .filter(venda -> venda.getFormaPagamento() != null)
                .forEach(venda -> vendasPorForma.merge(venda.getFormaPagamento(), 1L, Long::sum));

        return new DashboardResponseDTO(
                totalEntradas,
                totalSaidas,
                totalPendentes,
                totalEntradas.subtract(totalSaidas),
                despesasPorCategoria,
                vendasPorForma);
    }
}
