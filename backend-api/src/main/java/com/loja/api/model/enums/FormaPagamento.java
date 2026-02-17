package com.loja.api.model.enums;

public enum FormaPagamento {
    PIX("Pix"),
    CARTAO("Cartão"),
    DINHEIRO("Dinheiro"),
    TRANSFERENCIA("Transferência"),
    BOLETO("Boleto");

    private final String descricao;

    FormaPagamento(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
