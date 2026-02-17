import { useState, useEffect } from 'react';
import { LuPackage, LuUsers, LuReceipt, LuDollarSign } from 'react-icons/lu';
import produtoService from '../../api/produtoService';
import clienteService from '../../api/clienteService';
import vendaService from '../../api/vendaService';
import './Dashboard.css';

function Dashboard() {
    const [stats, setStats] = useState({
        produtos: 0,
        clientes: 0,
        vendas: 0,
        receita: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentVendas, setRecentVendas] = useState([]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [prodRes, cliRes, venRes] = await Promise.all([
                produtoService.getAll(),
                clienteService.getAll(),
                vendaService.getAll(),
            ]);

            const vendas = venRes.data;
            const receita = vendas.reduce(
                (sum, v) => sum + parseFloat(v.valorTotal || 0),
                0
            );

            setStats({
                produtos: prodRes.data.length,
                clientes: cliRes.data.length,
                vendas: vendas.length,
                receita,
            });

            setRecentVendas(vendas.slice(-5).reverse());
        } catch {
            // API offline — exibe zeros
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const cards = [
        {
            label: 'Produtos',
            value: stats.produtos,
            icon: <LuPackage />,
            color: 'purple',
        },
        {
            label: 'Clientes',
            value: stats.clientes,
            icon: <LuUsers />,
            color: 'blue',
        },
        {
            label: 'Vendas',
            value: stats.vendas,
            icon: <LuReceipt />,
            color: 'amber',
        },
        {
            label: 'Receita Total',
            value: formatCurrency(stats.receita),
            icon: <LuDollarSign />,
            color: 'green',
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Visão geral do seu negócio</p>
            </div>

            <div className="dashboard-grid">
                {cards.map((card) => (
                    <div className="dashboard-card" key={card.label}>
                        <div className={`card-icon ${card.color}`}>{card.icon}</div>
                        <div className="card-info">
                            <h3>{card.label}</h3>
                            <div className="card-value">
                                {loading ? '...' : card.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-section">
                <h3>Últimas Vendas</h3>
                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
                ) : recentVendas.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Nenhuma venda registrada ainda.</p>
                ) : (
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Valor Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentVendas.map((v) => (
                                    <tr key={v.id}>
                                        <td>{formatDate(v.dataVenda)}</td>
                                        <td>{v.clienteNome || 'Consumidor'}</td>
                                        <td><strong>{formatCurrency(v.valorTotal)}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
