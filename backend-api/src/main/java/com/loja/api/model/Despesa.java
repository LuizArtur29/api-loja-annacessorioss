package com.loja.api.model;

import com.loja.api.model.enums.CategoriaDespesa;
import com.loja.api.model.enums.FormaPagamento;
import com.loja.api.model.enums.StatusPagamento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "despesas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Despesa extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String descricao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate dataPagamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaDespesa categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPagamento status;

    @Enumerated(EnumType.STRING)
    private FormaPagamento formaPagamento;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(nullable = false)
    private Integer parcelas = 1;

    @Column(nullable = false)
    private Integer parcelaAtual = 1;
}
