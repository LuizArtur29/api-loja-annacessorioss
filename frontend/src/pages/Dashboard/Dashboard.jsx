import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import vendaService from '../../api/vendaService';
import despesaService from '../../api/despesaService';
import './Dashboard.css';

function Dashboard() {
    const { data: vendas = [], isLoading: loadingVendas } = useQuery({
        queryKey: ['vendas'],
        queryFn: async () => {
            const res = await vendaService.getAll();
            return res.data;
        }
    });

    const { data: despesas = [], isLoading: loadingDespesas } = useQuery({
        queryKey: ['despesas'],
        queryFn: async () => {
            const res = await despesaService.getAll();
            return res.data;
        }
    });

    const totalEntradas = vendas.reduce((acc, venda) => acc + parseFloat(venda.valorTotal || 0), 0);
    const totalSaidas = despesas.reduce((acc, despesa) => acc + parseFloat(despesa.valor || 0), 0);
    const saldoLiquido = totalEntradas - totalSaidas;

    const dataGraficoBarras = [
        { name: 'Entradas', valor: totalEntradas, color: '#10b981' },
        { name: 'Saídas', valor: totalSaidas, color: '#ef4444' }
    ];

    const categoriasLabels = {
        MERCADORIA: 'Mercadorias',
        EMBALAGEM: 'Embalagens',
        CUSTO_FIXO: 'Custos Fixos',
        MARKETING: 'Marketing',
        IMPOSTO: 'Impostos',
        OUTROS: 'Outros'
    };

    const despesasAgrupadas = despesas.reduce((acc, desp) => {
        const cat = desp.categoria || 'OUTROS';
        acc[cat] = (acc[cat] || 0) + parseFloat(desp.valor || 0);
        return acc;
    }, {});

    const dataGraficoPizza = Object.keys(despesasAgrupadas).map(key => ({
        name: categoriasLabels[key] || key,
        value: despesasAgrupadas[key]
    })).filter(item => item.value > 0);

    // Cores da Pizza (Tons de Dourado/Âmbar para a identidade visual)
    const COLORS = ['#d4af37', '#c29f2d', '#b08f23', '#f59e0b', '#d97706', '#71717a'];

    // --- ESTILOS PARA O TEMA ESCURO ---
    const chartTextColor = '#e4e4e7'; // Cor clara para eixos e legendas
    const tooltipStyle = {
        backgroundColor: '#272732', // Mesma cor de fundo dos cartões
        borderColor: 'rgba(255, 255, 255, 0.1)', // Borda subtil
        borderRadius: '8px',
        color: '#ffffff', // Texto branco dentro do tooltip
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)' // Sombra para destaque
    };
    // ----------------------------------

    const formatCurrency = (value) => {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    if (loadingVendas || loadingDespesas) {
        return <div className="page-header"><h2>A carregar painel financeiro...</h2></div>;
    }

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <h2>Painel Financeiro</h2>
                <p>Visão geral do negócio e distribuição de custos</p>
            </div>

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

            <div className="dashboard-charts">
                <div className="chart-section">
                    <h3>Balanço Geral</h3>
                    <div style={{ height: 350, width: '100%', marginTop: '20px' }}>
                        <ResponsiveContainer>
                            <BarChart data={dataGraficoBarras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                {/* Eixos com cor clara */}
                                <XAxis dataKey="name" stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                                <YAxis stroke={chartTextColor} tick={{ fill: chartTextColor }} tickFormatter={(val) => `R$ ${val}`} />
                                {/* Tooltip com estilo escuro corrigido */}
                                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={80}>
                                    {dataGraficoBarras.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-section">
                    <h3>Para onde vai o dinheiro?</h3>
                    <div style={{ height: 350, width: '100%', marginTop: '20px' }}>
                        {dataGraficoPizza.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={dataGraficoPizza}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                        stroke="none"
                                    >
                                        {dataGraficoPizza.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    {/* Tooltip e Legenda com cores claras */}
                                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: chartTextColor }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
                                Nenhuma despesa registada.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;