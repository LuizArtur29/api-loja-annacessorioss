package com.loja.api.service;

import com.loja.api.dto.DespesaRequestDTO;
import com.loja.api.model.Despesa;
import com.loja.api.model.enums.CategoriaDespesa;
import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.StatusPagamento;
import com.loja.api.repository.DespesaRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DespesaServiceTests {

    @Test
    void installmentsPreserveExactTotal() {
        DespesaRepository repository = mock(DespesaRepository.class);
        when(repository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        DespesaService service = new DespesaService(repository);

        var request = new DespesaRequestDTO(
                "Compra de mercadoria",
                new BigDecimal("100.00"),
                LocalDate.of(2026, 8, 5),
                CategoriaDespesa.MERCADORIA,
                StatusPagamento.PENDENTE,
                FormaPagamento.CARTAO,
                null,
                3);

        var parcelas = service.create(request);
        BigDecimal total = parcelas.stream()
                .map(item -> item.valor())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(new BigDecimal("100.00"), total);
        assertEquals(new BigDecimal("33.34"), parcelas.get(2).valor());
    }
}
