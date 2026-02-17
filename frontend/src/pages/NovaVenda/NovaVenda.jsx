import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LuPlus, LuTrash2, LuShoppingCart } from 'react-icons/lu';
import Select from 'react-select';
import produtoService from '../../api/produtoService';
import clienteService from '../../api/clienteService';
import vendaService from '../../api/vendaService';
import './NovaVenda.css';

function NovaVenda() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
        queryKey: ['produtos'],
        queryFn: async () => {
            const res = await produtoService.getAll();
            return res.data;
        }
    });

    const { data: clientes = [], isLoading: loadingClientes } = useQuery({
        queryKey: ['clientes'],
        queryFn: async () => {
            const res = await clienteService.getAll();
            return res.data;
        }
    });

    const [saving, setSaving] = useState(false);
    const [clienteId, setClienteId] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('');
    const [selectedProdutoOption, setSelectedProdutoOption] = useState(null);
    const [quantidade, setQuantidade] = useState(1);
    const [itens, setItens] = useState([]);

    const formaPagamentoOptions = [
        { value: 'PIX', label: '📱 Pix' },
        { value: 'CARTAO', label: '💳 Cartão' },
        { value: 'DINHEIRO', label: '💵 Dinheiro' },
        { value: 'TRANSFERENCIA', label: '🏦 Transferência' },
        { value: 'BOLETO', label: '📄 Boleto' }
    ];

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const produtoOptions = produtos.map((p) => ({
        value: p.id,
        label: `${p.nome} — ${formatCurrency(p.precoVenda)} (Estoque: ${p.quantidadeEstoque})`,
        produtoCompleto: p
    }));

    const clienteOptions = clientes.map((c) => ({
        value: c.id,
        label: c.nome
    }));

    // Estilos do React Select injetando as variáveis CSS do App.css
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: 'var(--surface-secondary)',
            borderColor: state.isFocused ? 'var(--accent-color)' : 'var(--border-color)',
            borderRadius: '10px',
            minHeight: '42px',
            boxShadow: 'none',
            '&:hover': { borderColor: state.isFocused ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.15)' },
            cursor: 'text'
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: 'var(--surface-primary)',
            border: `1px solid var(--border-color)`,
            borderRadius: '8px',
            zIndex: 100
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? 'var(--surface-hover)' : 'transparent',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            '&:active': { backgroundColor: 'var(--accent-alpha)' }
        }),
        singleValue: (provided) => ({ ...provided, color: 'var(--text-primary)' }),
        input: (provided) => ({ ...provided, color: 'var(--text-primary)' }),
        placeholder: (provided) => ({ ...provided, color: 'var(--text-muted)' })
    };

    const addItem = () => {
        if (!selectedProdutoOption) {
            toast.error('Selecione um produto');
            return;
        }

        const produto = selectedProdutoOption.produtoCompleto;

        if (quantidade > produto.quantidadeEstoque) {
            toast.error(`Estoque insuficiente. Apenas ${produto.quantidadeEstoque} unidades disponíveis.`);
            return;
        }

        const existing = itens.find((i) => i.produtoId === produto.id);
        if (existing) {
            if (existing.quantidade + quantidade > produto.quantidadeEstoque) {
                toast.error('A quantidade total ultrapassa o estoque disponível.');
                return;
            }
            setItens(
                itens.map((i) =>
                    i.produtoId === produto.id
                        ? { ...i, quantidade: i.quantidade + quantidade }
                        : i
                )
            );
        } else {
            setItens([
                ...itens,
                {
                    produtoId: produto.id,
                    produtoNome: produto.nome,
                    precoUnitario: parseFloat(produto.precoVenda),
                    quantidade,
                },
            ]);
        }
        setSelectedProdutoOption(null);
        setQuantidade(1);
    };

    const removeItem = (produtoId) => {
        setItens(itens.filter((i) => i.produtoId !== produtoId));
    };

    const total = itens.reduce((sum, i) => sum + i.precoUnitario * i.quantidade, 0);

    const handleFinalizar = async () => {
        if (itens.length === 0) {
            toast.error('Adicione pelo menos um item');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                clienteId: clienteId ? parseInt(clienteId) : null,
                formaPagamento: formaPagamento || null,
                itens: itens.map((i) => ({
                    produtoId: i.produtoId,
                    quantidade: i.quantidade,
                })),
            };
            await vendaService.create(payload);
            toast.success('Venda registada com sucesso!');

            queryClient.invalidateQueries({ queryKey: ['produtos'] });
            queryClient.invalidateQueries({ queryKey: ['vendas'] });

            navigate('/vendas');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao registar venda');
        } finally {
            setSaving(false);
        }
    };

    if (loadingProdutos || loadingClientes) {
        return <div className="data-table-loading"><div className="spinner" /></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Nova Venda</h2>
                <p>Registe uma nova venda no caixa</p>
            </div>

            <div className="nova-venda">
                <div className="venda-itens">
                    <div className="venda-itens-header">
                        <h3>Itens da Venda</h3>
                    </div>

                    <div className="add-item-row">
                        <div className="form-group" style={{ flex: 3 }}>
                            <label>Procurar Produto (Nome ou ID)</label>
                            <Select
                                options={produtoOptions}
                                value={selectedProdutoOption}
                                onChange={setSelectedProdutoOption}
                                placeholder="Digite para procurar..."
                                isSearchable
                                styles={customSelectStyles}
                                noOptionsMessage={() => "Nenhum produto encontrado"}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 0.5 }}>
                            <label>Qtd</label>
                            <input
                                type="number"
                                min="1"
                                value={quantidade}
                                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <button
                            className="btn-add-item"
                            onClick={addItem}
                            title="Adicionar item"
                        >
                            <LuPlus style={{ fontSize: '1.2rem' }} />
                        </button>
                    </div>

                    {itens.length === 0 ? (
                        <div className="itens-empty">
                            <LuShoppingCart style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.5 }} />
                            <span>Nenhum item adicionado</span>
                        </div>
                    ) : (
                        <div className="itens-list">
                            {itens.map((item) => (
                                <div className="item-row" key={item.produtoId}>
                                    <span className="item-name">{item.produtoNome}</span>
                                    <span className="item-detail">{item.quantidade}x</span>
                                    <span className="item-detail">{formatCurrency(item.precoUnitario)}</span>
                                    <span className="item-subtotal">{formatCurrency(item.precoUnitario * item.quantidade)}</span>
                                    <button className="btn-remove-item" onClick={() => removeItem(item.produtoId)} title="Remover"><LuTrash2 /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="venda-resumo">
                    <h3>Resumo da Venda</h3>

                    <div className="form-group">
                        <label>Cliente (opcional)</label>
                        <Select
                            options={clienteOptions}
                            value={clienteOptions.find(c => c.value === clienteId)}
                            onChange={(option) => setClienteId(option ? option.value : '')}
                            placeholder="Consumidor final..."
                            isSearchable
                            isClearable
                            styles={customSelectStyles}
                            noOptionsMessage={() => "Cliente não encontrado"}
                        />
                    </div>

                    <div className="form-group">
                        <label>Forma de Pagamento</label>
                        <Select
                            options={formaPagamentoOptions}
                            value={formaPagamentoOptions.find(f => f.value === formaPagamento) || null}
                            onChange={(option) => setFormaPagamento(option ? option.value : '')}
                            placeholder="Selecione o pagamento..."
                            isClearable
                            isSearchable={false}
                            styles={customSelectStyles}
                        />
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        <div className="resumo-line">
                            <span>Total de Itens</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                                {itens.reduce((s, i) => s + i.quantidade, 0)}
                            </span>
                        </div>

                        <div className="resumo-total">
                            <span>Total a Pagar</span>
                            <span className="total-value">{formatCurrency(total)}</span>
                        </div>

                        <button
                            className="btn-finalizar"
                            onClick={handleFinalizar}
                            disabled={saving || itens.length === 0}
                        >
                            <LuShoppingCart style={{ fontSize: '1.2rem' }} />
                            {saving ? 'A Registar...' : 'Finalizar Venda'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NovaVenda;