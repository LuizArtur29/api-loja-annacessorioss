import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, CartesianGrid
} from 'recharts';
import vendaService from '../../api/vendaService';
import despesaService from '../../api/despesaService';
import './Dashboard.css';

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label, formatCurrency }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="custom-tooltip">
            <p className="tooltip-label">{label || payload[0]?.name}</p>
            <p className="tooltip-value">{formatCurrency(payload[0].value)}</p>
        </div>
    );
};

/* ── Custom Pie Label ── */
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x} y={y}
            className="pie-label-text"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

/* ── Meses ── */
const MESES = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
];

function Dashboard() {
    const now = new Date();
    const [mesFiltro, setMesFiltro] = useState(now.getMonth() + 1);
    const [anoFiltro, setAnoFiltro] = useState(now.getFullYear());

    const anos = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) anos.push(y);

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

    /* ── Filtragem por mês/ano ── */
    const vendasFiltradas = useMemo(() => {
        return vendas.filter(v => {
            if (!v.dataVenda) return false;
            const d = new Date(v.dataVenda);
            return (d.getMonth() + 1) === mesFiltro && d.getFullYear() === anoFiltro;
        });
    }, [vendas, mesFiltro, anoFiltro]);

    const despesasFiltradas = useMemo(() => {
        return despesas.filter(d => {
            if (!d.dataPagamento) return false;
            const [ano, mes] = d.dataPagamento.split('-').map(Number);
            return mes === mesFiltro && ano === anoFiltro;
        });
    }, [despesas, mesFiltro, anoFiltro]);

    /* ── Cálculos (Saídas = apenas PAGAS) ── */
    const totalEntradas = vendasFiltradas.reduce((acc, v) => acc + parseFloat(v.valorTotal || 0), 0);
    const despesasPagas = despesasFiltradas.filter(d => d.status === 'PAGO');
    const totalSaidas = despesasPagas.reduce((acc, d) => acc + parseFloat(d.valor || 0), 0);
    const totalPendentes = despesasFiltradas
        .filter(d => d.status === 'PENDENTE' || d.status === 'ATRASADO')
        .reduce((acc, d) => acc + parseFloat(d.valor || 0), 0);
    const saldoLiquido = totalEntradas - totalSaidas;

    /* ── Dados do Gráfico de Área ── */
    const dataGraficoArea = [
        { name: 'Entradas', valor: totalEntradas },
        { name: 'Saídas (Pagas)', valor: totalSaidas }
    ];

    /* ── Categorias ── */
    const categoriasLabels = {
        MERCADORIA: 'Mercadorias',
        EMBALAGEM: 'Embalagens',
        CUSTO_FIXO: 'Custos Fixos',
        MARKETING: 'Marketing',
        IMPOSTO: 'Impostos',
        OUTROS: 'Outros'
    };

    const despesasAgrupadas = despesasPagas.reduce((acc, desp) => {
        const cat = desp.categoria || 'OUTROS';
        acc[cat] = (acc[cat] || 0) + parseFloat(desp.valor || 0);
        return acc;
    }, {});

    const dataGraficoPizza = Object.keys(despesasAgrupadas).map(key => ({
        name: categoriasLabels[key] || key,
        value: despesasAgrupadas[key]
    })).filter(item => item.value > 0);

    /* ── Paleta e estilos ── */
    const COLORS = ['#D4A017', '#B8860B', '#E8BF4A', '#C68A1A', '#8B6914', '#A0784C'];
    const axisColor = '#7A6E5D';
    const gridColor = '#F0EAE0';

    const formatCurrency = (value) => {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const mesLabel = MESES.find(m => m.value === mesFiltro)?.label || '';

    if (loadingVendas || loadingDespesas) {
        return <div className="page-header"><h2>Carregando painel financeiro…</h2></div>;
    }

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <h2>Painel Financeiro</h2>
                <p>Visão geral do negócio e distribuição de custos</p>
            </div>

            {/* ── Filtros de Mês/Ano ── */}
            <div className="dashboard-filters">
                <span className="filter-label">📅 Período:</span>
                <select
                    value={mesFiltro}
                    onChange={(e) => setMesFiltro(Number(e.target.value))}
                    className="filter-select"
                >
                    {MESES.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
                <select
                    value={anoFiltro}
                    onChange={(e) => setAnoFiltro(Number(e.target.value))}
                    className="filter-select"
                >
                    {anos.map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
            </div>

            {/* ── Summary Cards ── */}
            <div className="cards-grid">
                <div className="summary-card entradas">
                    <span className="card-icon">📈</span>
                    <h3>Entradas (Vendas)</h3>
                    <h2>{formatCurrency(totalEntradas)}</h2>
                </div>
                <div className="summary-card saidas">
                    <span className="card-icon">📉</span>
                    <h3>Saídas (Pagas)</h3>
                    <h2>{formatCurrency(totalSaidas)}</h2>
                </div>
                <div className={`summary-card saldo ${saldoLiquido >= 0 ? 'positivo' : 'negativo'}`}>
                    <span className="card-icon">💰</span>
                    <h3>Saldo Líquido</h3>
                    <h2>{formatCurrency(saldoLiquido)}</h2>
                </div>
            </div>

            {/* ── Pendentes/Atrasados ── */}
            {totalPendentes > 0 && (
                <div style={{
                    background: 'var(--accent-alpha)', border: '1px solid var(--accent-light)',
                    borderRadius: 'var(--radius-md)', padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem',
                    color: 'var(--accent-dark)'
                }}>
                    <span>🕐</span>
                    <span>
                        Você tem <strong>{formatCurrency(totalPendentes)}</strong> em despesas pendentes/atrasadas
                        em {mesLabel}/{anoFiltro} que não estão no saldo acima.
                    </span>
                </div>
            )}

            {/* ── Charts ── */}
            <div className="dashboard-charts">
                <div className="chart-section">
                    <h3>Balanço de {mesLabel}</h3>
                    <p className="chart-subtitle">Comparativo entre entradas e saídas pagas</p>
                    <div style={{ height: 320, width: '100%' }}>
                        <ResponsiveContainer>
                            <AreaChart data={dataGraficoArea} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#D4A017" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#D4A017" stopOpacity={0.03} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke={axisColor}
                                    tick={{ fill: axisColor, fontSize: 13, fontFamily: 'Outfit' }}
                                    axisLine={{ stroke: gridColor }}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke={axisColor}
                                    tick={{ fill: axisColor, fontSize: 12, fontFamily: 'Outfit' }}
                                    tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                                <Area
                                    type="monotone"
                                    dataKey="valor"
                                    stroke="#D4A017"
                                    strokeWidth={2.5}
                                    fill="url(#goldGradient)"
                                    dot={{ r: 5, fill: '#D4A017', stroke: '#fff', strokeWidth: 2.5 }}
                                    activeDot={{ r: 7, fill: '#B8860B', stroke: '#fff', strokeWidth: 2.5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-section">
                    <h3>Para onde vai o dinheiro?</h3>
                    <p className="chart-subtitle">Despesas pagas em {mesLabel} por categoria</p>
                    <div style={{ height: 320, width: '100%' }}>
                        {dataGraficoPizza.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={dataGraficoPizza}
                                        cx="50%"
                                        cy="48%"
                                        innerRadius={70}
                                        outerRadius={105}
                                        paddingAngle={4}
                                        dataKey="value"
                                        nameKey="name"
                                        stroke="#fff"
                                        strokeWidth={2}
                                        label={renderCustomLabel}
                                        labelLine={false}
                                    >
                                        {dataGraficoPizza.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        iconSize={8}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty-state">
                                <span className="empty-icon">📊</span>
                                <span>Nenhuma despesa paga em {mesLabel}/{anoFiltro}.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;