import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LuBanknote, LuBuilding2, LuCreditCard, LuFileText, LuPlus, LuSmartphone, LuTrash2, LuShoppingCart } from 'react-icons/lu';
import { NumericFormat } from 'react-number-format';
import Select from 'react-select';
import produtoService from '../../api/produtoService';
import clienteService from '../../api/clienteService';
import vendaService from '../../api/vendaService';
import customSelectStyles from '../../utils/selectStyles';
import './NovaVenda.css';
import PageHeader from '../../components/PageHeader/PageHeader';

function NovaVenda() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
        queryKey: ['produtos-all'],
        queryFn: async () => {
            const res = await produtoService.getAllNoPagination();
            return res.data;
        }
    });

    const { data: clientes = [], isLoading: loadingClientes } = useQuery({
        queryKey: ['clientes-all'],
        queryFn: async () => {
            const res = await clienteService.getAllNoPagination();
            return res.data;
        }
    });

    const [saving, setSaving] = useState(false);
    const [clienteId, setClienteId] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('');
    const [selectedProdutoOption, setSelectedProdutoOption] = useState(null);
    const [quantidade, setQuantidade] = useState(1);
    const [itens, setItens] = useState([]);
    const [desconto, setDesconto] = useState('');

    const formaPagamentoOptions = [
        { value: 'PIX', label: 'Pix', Icon: LuSmartphone },
        { value: 'CARTAO', label: 'Cartão', Icon: LuCreditCard },
        { value: 'DINHEIRO', label: 'Dinheiro', Icon: LuBanknote },
        { value: 'TRANSFERENCIA', label: 'Transferência', Icon: LuBuilding2 },
        { value: 'BOLETO', label: 'Boleto', Icon: LuFileText }
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

    const subtotal = itens.reduce((sum, i) => sum + i.precoUnitario * i.quantidade, 0);
    const descontoValue = parseFloat(desconto) || 0;
    const total = Math.max(subtotal - descontoValue, 0);

    const handleFinalizar = async () => {
        if (itens.length === 0) {
            toast.error('Adicione pelo menos um item');
            return;
        }
        if (descontoValue > subtotal) {
            toast.error('O desconto não pode ser maior que o subtotal');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                clienteId: clienteId ? parseInt(clienteId) : null,
                formaPagamento: formaPagamento || null,
                desconto: descontoValue > 0 ? descontoValue : null,
                itens: itens.map((i) => ({
                    produtoId: i.produtoId,
                    quantidade: i.quantidade,
                })),
            };
            await vendaService.create(payload);
            toast.success('Venda registada com sucesso!');

            queryClient.invalidateQueries({ queryKey: ['produtos'] });
            queryClient.invalidateQueries({ queryKey: ['produtos-all'] });
            queryClient.invalidateQueries({ queryKey: ['produtos-valor-total'] });
            queryClient.invalidateQueries({ queryKey: ['vendas'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });

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
            <PageHeader
                title="Nova Venda"
                description="Monte o pedido, confira os valores e finalize a venda"
                breadcrumbs={[{ label: 'Vendas' }, { label: 'Nova venda' }]}
            />

            <div className="nova-venda">
                <div className="venda-itens">
                    <div className="venda-itens-header">
                        <h3>Itens da Venda</h3>
                    </div>

                    <div className="add-item-row">
                        <div className="form-group add-product-field">
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
                        <div className="form-group quantity-field">
                            <label>Qtd</label>
                            <input
                                type="number"
                                min="1"
                                max={selectedProdutoOption?.produtoCompleto?.quantidadeEstoque || undefined}
                                value={quantidade}
                                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <button
                            className="btn-add-item"
                            onClick={addItem}
                            title="Adicionar item"
                            disabled={!selectedProdutoOption || quantidade < 1}
                        >
                            <LuPlus />
                        </button>
                    </div>

                    {itens.length === 0 ? (
                        <div className="itens-empty">
                            <LuShoppingCart className="empty-cart-icon" />
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
                            formatOptionLabel={({ label, Icon }) => (
                                <span className="select-option-icon"><Icon />{label}</span>
                            )}
                        />
                    </div>

                    <div className="form-group">
                        <label>Desconto (R$)</label>
                        <NumericFormat
                            value={desconto}
                            onValueChange={(values) => setDesconto(values.value)}
                            thousandSeparator="."
                            decimalSeparator=","
                            prefix="R$ "
                            decimalScale={2}
                            fixedDecimalScale
                            placeholder="R$ 0,00"
                            allowNegative={false}
                        />
                        {descontoValue > subtotal && <span className="form-error">O desconto não pode ultrapassar o subtotal.</span>}
                    </div>

                    <div className="resumo-totals">
                        <div className="resumo-line">
                            <span>Total de Itens</span>
                            <span className="resumo-value">
                                {itens.reduce((s, i) => s + i.quantidade, 0)}
                            </span>
                        </div>

                        <div className="resumo-line">
                            <span>Subtotal</span>
                            <span className="resumo-value">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>

                        {descontoValue > 0 && (
                            <div className="resumo-line resumo-discount">
                                <span>Desconto</span>
                                <span>
                                    − {formatCurrency(descontoValue)}
                                </span>
                            </div>
                        )}

                        <div className="resumo-total">
                            <span>Total a Pagar</span>
                            <span className="total-value">{formatCurrency(total)}</span>
                        </div>

                        <button
                            className="btn-finalizar"
                            onClick={handleFinalizar}
                            disabled={saving || itens.length === 0 || descontoValue > subtotal}
                        >
                            <LuShoppingCart />
                            {saving ? 'A Registar...' : 'Finalizar Venda'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NovaVenda;
