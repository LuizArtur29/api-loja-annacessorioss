import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuPlus, LuTrash2, LuShoppingCart } from 'react-icons/lu';
import produtoService from '../../api/produtoService';
import clienteService from '../../api/clienteService';
import vendaService from '../../api/vendaService';
import './NovaVenda.css';

function NovaVenda() {
    const navigate = useNavigate();
    const [produtos, setProdutos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [clienteId, setClienteId] = useState('');
    const [selectedProdutoId, setSelectedProdutoId] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [itens, setItens] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [prodRes, cliRes] = await Promise.all([
                produtoService.getAll(),
                clienteService.getAll(),
            ]);
            setProdutos(prodRes.data);
            setClientes(cliRes.data);
        } catch {
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        if (!selectedProdutoId) {
            toast.error('Selecione um produto');
            return;
        }
        const produto = produtos.find((p) => p.id === parseInt(selectedProdutoId));
        if (!produto) return;

        const existing = itens.find((i) => i.produtoId === produto.id);
        if (existing) {
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
        setSelectedProdutoId('');
        setQuantidade(1);
    };

    const removeItem = (produtoId) => {
        setItens(itens.filter((i) => i.produtoId !== produtoId));
    };

    const total = itens.reduce(
        (sum, i) => sum + i.precoUnitario * i.quantidade,
        0
    );

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleFinalizar = async () => {
        if (itens.length === 0) {
            toast.error('Adicione pelo menos um item');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                clienteId: clienteId ? parseInt(clienteId) : null,
                itens: itens.map((i) => ({
                    produtoId: i.produtoId,
                    quantidade: i.quantidade,
                })),
            };
            await vendaService.create(payload);
            toast.success('Venda registrada com sucesso!');
            navigate('/vendas');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao registrar venda');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="data-table-loading">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h2>Nova Venda</h2>
                <p>Registre uma nova venda</p>
            </div>

            <div className="nova-venda">
                <div className="venda-itens">
                    <div className="venda-itens-header">
                        <h3>Itens da Venda</h3>
                    </div>

                    <div className="add-item-row">
                        <div className="form-group">
                            <label>Produto</label>
                            <select
                                value={selectedProdutoId}
                                onChange={(e) => setSelectedProdutoId(e.target.value)}
                            >
                                <option value="">Selecione um produto...</option>
                                {produtos.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nome} — {formatCurrency(p.precoVenda)} (est: {p.quantidadeEstoque})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Qtd</label>
                            <input
                                type="number"
                                min="1"
                                value={quantidade}
                                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <button
                            className="btn-icon btn-add-item"
                            onClick={addItem}
                            title="Adicionar item"
                        >
                            <LuPlus />
                        </button>
                    </div>

                    {itens.length === 0 ? (
                        <div className="itens-empty">
                            <LuShoppingCart style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                            Nenhum item adicionado
                        </div>
                    ) : (
                        <div className="itens-list">
                            {itens.map((item) => (
                                <div className="item-row" key={item.produtoId}>
                                    <span className="item-name">{item.produtoNome}</span>
                                    <span className="item-detail">{item.quantidade}x</span>
                                    <span className="item-detail">
                                        {formatCurrency(item.precoUnitario)}
                                    </span>
                                    <span className="item-subtotal">
                                        {formatCurrency(item.precoUnitario * item.quantidade)}
                                    </span>
                                    <button
                                        className="btn-remove-item"
                                        onClick={() => removeItem(item.produtoId)}
                                        title="Remover"
                                    >
                                        <LuTrash2 />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="venda-resumo">
                    <h3>Resumo</h3>

                    <div className="form-group">
                        <label>Cliente (opcional)</label>
                        <select
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                        >
                            <option value="">Consumidor final</option>
                            {clientes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="resumo-line">
                        <span>Itens</span>
                        <span>{itens.reduce((s, i) => s + i.quantidade, 0)}</span>
                    </div>

                    <div className="resumo-total">
                        <span>Total</span>
                        <span className="total-value">{formatCurrency(total)}</span>
                    </div>

                    <button
                        className="btn btn-primary btn-finalizar"
                        onClick={handleFinalizar}
                        disabled={saving || itens.length === 0}
                    >
                        <LuShoppingCart />
                        {saving ? 'Registrando...' : 'Finalizar Venda'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NovaVenda;
