ALTER TABLE movimentacoes_estoque
    ADD COLUMN IF NOT EXISTS responsavel VARCHAR(50) NOT NULL DEFAULT 'sistema';

ALTER TABLE vendas
    ADD COLUMN IF NOT EXISTS motivo_cancelamento VARCHAR(255),
    ADD COLUMN IF NOT EXISTS cancelado_por VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_responsavel_data
    ON movimentacoes_estoque (responsavel, data_movimentacao DESC);
