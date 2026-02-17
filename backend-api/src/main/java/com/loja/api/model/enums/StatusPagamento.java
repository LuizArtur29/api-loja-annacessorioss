package com.loja.api.model.enums;

public enum StatusPagamento {
    PAGO("Pago"),
    PENDENTE("Pendente"),
    ATRASADO("Atrasado");

    private final String descricao;

    StatusPagamento(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
