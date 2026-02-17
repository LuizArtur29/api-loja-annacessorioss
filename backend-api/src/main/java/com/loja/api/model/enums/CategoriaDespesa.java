package com.loja.api.model.enums;

public enum CategoriaDespesa {
    MERCADORIA("Mercadorias e Estoque"),
    EMBALAGEM("Embalagens e Envios"),
    CUSTO_FIXO("Custos Fixos (Luz, Água, Internet)"),
    MARKETING("Marketing e Anúncios"),
    IMPOSTO("Impostos e Taxas"),
    OUTROS("Outros");

    private final String descricao;

    CategoriaDespesa(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}