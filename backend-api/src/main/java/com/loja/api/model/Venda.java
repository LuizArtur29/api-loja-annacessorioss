package com.loja.api.model;

import com.loja.api.model.enums.FormaPagamento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vendas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Venda extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dataVenda;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Enumerated(EnumType.STRING)
    private FormaPagamento formaPagamento;

    @Column(precision = 10, scale = 2)
    private BigDecimal desconto = BigDecimal.ZERO;

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemVenda> itens = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.dataVenda == null) {
            this.dataVenda = LocalDateTime.now();
        }
    }
}
