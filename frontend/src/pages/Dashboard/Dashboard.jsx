import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import vendaService from '../../api/vendaService';
import despesaService from '../../api/despesaService';
import './Dashboard.css';

function Dashboard() {
    // 1. Buscar Vendas (Entradas) com cache
    const { data: vendas = [], isLoading: loadingVendas } = useQuery({
        queryKey: ['vendas'],
        queryFn: async () => {
            const res = await vendaService.getAll();
            return res.data;
        }
    });

    // 2. Buscar Despesas (Saídas) com cache
    const { data: despesas = [], isLoading: loadingDespesas } = useQuery({
        queryKey: ['despesas'],
        queryFn: async () => {
            const res = await despesaService.getAll();
            return res.data;
        }
    });

    // 3. Cálculos Financeiros
    const totalEntradas = vendas.reduce((acc, venda) => acc + venda.valorTotal, 0);
    const totalSaidas = despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
    const saldoLiquido = totalEntradas - totalSaidas;

    // 4. Preparar Dados para o Gráfico
    const dataGrafico = [
        { name: 'Entradas', valor: totalEntradas, color: '#10b981' }, // Verde
        { name: 'Saídas', valor: totalSaidas, color: '#ef4444' }     // Vermelho
    ];

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // Pequeno feedback visual enquanto os dados carregam inicialmente
    if (loadingVendas || loadingDespesas) {
        return (
            <div className="page-header">
                <h2>A carregar painel financeiro...</h2>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <h2>Painel Financeiro</h2>
                <p>Visão geral do negócio</p>
            </div>

            {/* Cartões de Resumo */}
            <div className="cards-grid">
                <div className="summary-card entradas">
                    <h3>Entradas (Vendas)</h3>
                    <h2>{formatCurrency(totalEntradas)}</h2>
                </div>
                <div className="summary-card saidas">
                    <h3>Saídas (Despesas)</h3>
                    <h2>{formatCurrency(totalSaidas)}</h2>
                </div>
                <div className={`summary-card saldo ${saldoLiquido >= 0 ? 'positivo' : 'negativo'}`}>
                    <h3>Saldo Líquido</h3>
                    <h2>{formatCurrency(saldoLiquido)}</h2>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Gráfico de Barras */}
                <div className="chart-section">
                    <h3>Entradas vs Saídas</h3>
                    <div style={{ height: 350, width: '100%', marginTop: '20px' }}>
                        <ResponsiveContainer>
                            <BarChart data={dataGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#a1a1aa" />
                                <YAxis stroke="#a1a1aa" tickFormatter={(val) => `R$ ${val}`} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: '#1c1c27', borderColor: '#333', borderRadius: '8px', color: '#f0f0f5' }}
                                />
                                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={100}>
                                    {dataGrafico.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;