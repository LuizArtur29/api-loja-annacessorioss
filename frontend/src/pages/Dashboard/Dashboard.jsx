import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, CartesianGrid,
    BarChart, Bar
} from 'recharts';
import {
    LuArrowDownRight, LuArrowUpRight, LuCalendarDays, LuChartPie,
    LuCircleDollarSign, LuClock3, LuCreditCard, LuPackageSearch, LuReceiptText,
    LuShoppingBag, LuTriangleAlert
} from 'react-icons/lu';
import dashboardService from '../../api/dashboardService';
import produtoService from '../../api/produtoService';
import PageHeader from '../../components/PageHeader/PageHeader';
import { PageSkeleton } from '../../components/Skeleton/Skeleton';
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
const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent }) => {
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

    const { data: resumo, isLoading: loadingResumo, isError } = useQuery({
        queryKey: ['dashboard', anoFiltro, mesFiltro],
        queryFn: async () => {
            const res = await dashboardService.getResumo(anoFiltro, mesFiltro);
            return res.data;
        }
    });

    const periodoAnterior = mesFiltro === 1
        ? { ano: anoFiltro - 1, mes: 12 }
        : { ano: anoFiltro, mes: mesFiltro - 1 };

    const { data: resumoAnterior } = useQuery({
        queryKey: ['dashboard', periodoAnterior.ano, periodoAnterior.mes],
        queryFn: async () => (await dashboardService.getResumo(periodoAnterior.ano, periodoAnterior.mes)).data,
    });

    const { data: produtos = [] } = useQuery({
        queryKey: ['produtos-all'],
        queryFn: async () => (await produtoService.getAllNoPagination()).data,
        staleTime: 60 * 1000,
    });

    const totalEntradas = parseFloat(resumo?.totalEntradas || 0);
    const totalSaidas = parseFloat(resumo?.totalSaidas || 0);
    const totalPendentes = parseFloat(resumo?.totalPendentes || 0);
    const saldoLiquido = parseFloat(resumo?.saldoLiquido || 0);
    const quantidadeVendas = Number(resumo?.quantidadeVendas || 0);
    const ticketMedio = quantidadeVendas > 0 ? totalEntradas / quantidadeVendas : 0;
    const produtosEstoqueBaixo = produtos
        .filter((produto) => Number(produto.quantidadeEstoque) <= 5)
        .sort((a, b) => a.quantidadeEstoque - b.quantidadeEstoque);

    const getVariation = (current, previous) => {
        const previousValue = Number(previous || 0);
        if (previousValue === 0) return current === 0 ? 0 : null;
        return ((current - previousValue) / Math.abs(previousValue)) * 100;
    };

    const variationLabel = (variation) => variation == null
        ? 'Sem base anterior'
        : `${variation >= 0 ? '+' : ''}${variation.toFixed(1).replace('.', ',')}% vs. mês anterior`;

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

    const despesasAgrupadas = resumo?.despesasPorCategoria || {};

    const dataGraficoPizza = Object.keys(despesasAgrupadas).map(key => ({
        name: categoriasLabels[key] || key,
        value: despesasAgrupadas[key]
    })).filter(item => item.value > 0);

    /* ── Formas de Pagamento (vendas) ── */
    const formaPgtoLabels = {
        PIX: 'Pix', CARTAO: 'Cartão', DINHEIRO: 'Dinheiro',
        TRANSFERENCIA: 'Transferência', BOLETO: 'Boleto'
    };

    const vendasPorPgto = resumo?.vendasPorFormaPagamento || {};

    const dataGraficoPgto = Object.keys(vendasPorPgto)
        .filter(k => k !== 'NAO_INFORMADO')
        .map(key => ({
            name: formaPgtoLabels[key] || key,
            quantidade: vendasPorPgto[key]
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

    /* ── Paleta e estilos ── */
    const COLORS = ['#D4A017', '#B8860B', '#E8BF4A', '#C68A1A', '#8B6914', '#A0784C'];
    const COLORS_PGTO = ['#27AE60', '#2980B9', '#D4A017', '#8E44AD', '#E67E22'];
    const axisColor = '#7A6E5D';
    const gridColor = '#F0EAE0';

    const formatCurrency = (value) => {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const mesLabel = MESES.find(m => m.value === mesFiltro)?.label || '';

    if (loadingResumo) {
        return <PageSkeleton />;
    }

    if (isError) {
        return (
            <PageHeader title="Não foi possível carregar o painel" description="Verifique a conexão e tente novamente." />
        );
    }

    return (
        <div className="dashboard-container">
            <PageHeader
                title="Painel Financeiro"
                description="Visão geral do negócio, desempenho e atenção ao estoque"
                eyebrow="Resumo do negócio"
                breadcrumbs={[{ label: 'Dashboard' }]}
                actions={<Link to="/nova-venda" className="btn btn-primary"><LuShoppingBag /> Nova venda</Link>}
            />

            {/* ── Filtros de Mês/Ano ── */}
            <div className="dashboard-filters">
                <span className="filter-label"><LuCalendarDays /> Período</span>
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
                    <span className="card-icon"><LuArrowUpRight /></span>
                    <div><h3>Entradas (Vendas)</h3><h2>{formatCurrency(totalEntradas)}</h2>
                        <small className={`metric-trend ${getVariation(totalEntradas, resumoAnterior?.totalEntradas) >= 0 ? 'up' : 'down'}`}>{variationLabel(getVariation(totalEntradas, resumoAnterior?.totalEntradas))}</small>
                    </div>
                </div>
                <div className="summary-card saidas">
                    <span className="card-icon"><LuArrowDownRight /></span>
                    <div><h3>Saídas (Pagas)</h3><h2>{formatCurrency(totalSaidas)}</h2>
                        <small className="metric-trend neutral">{variationLabel(getVariation(totalSaidas, resumoAnterior?.totalSaidas))}</small>
                    </div>
                </div>
                <div className={`summary-card saldo ${saldoLiquido >= 0 ? 'positivo' : 'negativo'}`}>
                    <span className="card-icon"><LuCircleDollarSign /></span>
                    <div><h3>Saldo Líquido</h3><h2>{formatCurrency(saldoLiquido)}</h2>
                        <small className={`metric-trend ${getVariation(saldoLiquido, resumoAnterior?.saldoLiquido) >= 0 ? 'up' : 'down'}`}>{variationLabel(getVariation(saldoLiquido, resumoAnterior?.saldoLiquido))}</small>
                    </div>
                </div>
                <div className="summary-card vendas-count">
                    <span className="card-icon"><LuReceiptText /></span>
                    <div><h3>Vendas realizadas</h3><h2>{quantidadeVendas}</h2><small className="metric-trend neutral">No período selecionado</small></div>
                </div>
                <div className="summary-card ticket">
                    <span className="card-icon"><LuCreditCard /></span>
                    <div><h3>Ticket médio</h3><h2>{formatCurrency(ticketMedio)}</h2><small className="metric-trend neutral">Valor médio por venda</small></div>
                </div>
            </div>

            <section className="stock-alert-section">
                <div className="section-heading">
                    <div><h3><LuPackageSearch /> Atenção ao estoque</h3><p>Produtos com cinco unidades ou menos</p></div>
                    <Link to="/produtos?estoque=baixo">Ver todos</Link>
                </div>
                {produtosEstoqueBaixo.length > 0 ? (
                    <div className="stock-alert-list">
                        {produtosEstoqueBaixo.slice(0, 5).map((produto) => (
                            <Link className="stock-alert-item" to={`/produtos?produto=${encodeURIComponent(produto.nome)}`} key={produto.id}>
                                <span className={`stock-level ${produto.quantidadeEstoque === 0 ? 'empty' : 'low'}`}><LuTriangleAlert /></span>
                                <span><strong>{produto.nome}</strong><small>{produto.categoriaNome}</small></span>
                                <b>{produto.quantidadeEstoque === 0 ? 'Sem estoque' : `${produto.quantidadeEstoque} un.`}</b>
                            </Link>
                        ))}
                    </div>
                ) : <div className="stock-ok">Todos os produtos estão com estoque saudável.</div>}
            </section>

            {/* ── Pendentes/Atrasados ── */}
            {totalPendentes > 0 && (
                <div className="pending-notice">
                    <LuClock3 />
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
                    <div className="chart-canvas">
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
                    <div className="chart-canvas">
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
                                <span className="empty-icon"><LuChartPie /></span>
                                <span>Nenhuma despesa paga em {mesLabel}/{anoFiltro}.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Formas de Pagamento ── */}
            <div className="dashboard-charts dashboard-charts-full">
                <div className="chart-section">
                    <h3>Formas de Pagamento mais usadas</h3>
                    <p className="chart-subtitle">Vendas em {mesLabel} por método de pagamento</p>
                    <div className="chart-canvas chart-canvas-short">
                        {dataGraficoPgto.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart data={dataGraficoPgto} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
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
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value} venda${value > 1 ? 's' : ''}`, 'Quantidade']}
                                        contentStyle={{
                                            background: 'var(--surface-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontFamily: 'Outfit, sans-serif'
                                        }}
                                    />
                                    <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
                                        {dataGraficoPgto.map((entry, index) => (
                                            <Cell key={`bar-${index}`} fill={COLORS_PGTO[index % COLORS_PGTO.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty-state">
                                <span className="empty-icon"><LuCreditCard /></span>
                                <span>Nenhuma venda com forma de pagamento em {mesLabel}/{anoFiltro}.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
