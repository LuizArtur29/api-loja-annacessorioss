import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { LuBan, LuCircleCheck, LuEye, LuPlus, LuX } from 'react-icons/lu';
import vendaService from '../../api/vendaService';
import DataTable from '../../components/DataTable/DataTable';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Vendas.css';
import PageHeader from '../../components/PageHeader/PageHeader';
import FilterBar from '../../components/FilterBar/FilterBar';

function Vendas() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('');
    const [formaFiltro, setFormaFiltro] = useState('');
    const [inicioFiltro, setInicioFiltro] = useState('');
    const [fimFiltro, setFimFiltro] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedVenda, setSelectedVenda] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, venda: null, motivo: '' });

    const { data: vendasPage, isLoading: loading } = useQuery({
        queryKey: ['vendas', page, search, statusFiltro, formaFiltro, inicioFiltro, fimFiltro],
        queryFn: async () => {
            const res = await vendaService.getAll(page, 10, search, {
                ...(statusFiltro && { status: statusFiltro }),
                ...(formaFiltro && { formaPagamento: formaFiltro }),
                ...(inicioFiltro && { inicio: inicioFiltro }),
                ...(fimFiltro && { fim: fimFiltro }),
            });
            return res.data;
        },
        staleTime: 60 * 1000,
    });

    const vendas = vendasPage?.content || [];
    const pagination = vendasPage ? {
        number: vendasPage.number,
        totalPages: vendasPage.totalPages,
        totalElements: vendasPage.totalElements,
        first: vendasPage.first,
        last: vendasPage.last,
    } : null;

    useEffect(() => {
        if (vendasPage && !vendasPage.last) {
            queryClient.prefetchQuery({
                queryKey: ['vendas', page + 1, search, statusFiltro, formaFiltro, inicioFiltro, fimFiltro],
                queryFn: async () => {
                    const res = await vendaService.getAll(page + 1, 10, search, {
                        ...(statusFiltro && { status: statusFiltro }),
                        ...(formaFiltro && { formaPagamento: formaFiltro }),
                        ...(inicioFiltro && { inicio: inicioFiltro }),
                        ...(fimFiltro && { fim: fimFiltro }),
                    });
                    return res.data;
            },
            staleTime: 60 * 1000,
            });
        }
    }, [vendasPage, page, search, statusFiltro, formaFiltro, inicioFiltro, fimFiltro, queryClient]);

    const openDetail = async (venda) => {
        try {
            const res = await vendaService.getById(venda.id);
            setSelectedVenda(res.data);
            setDetailOpen(true);
        } catch {
            toast.error('Erro ao carregar detalhes');
        }
    };

    const handleDeleteClick = (venda) => {
        if (venda.status === 'CANCELADA') {
            toast.error('Esta venda já está cancelada');
            return;
        }
        setConfirmDelete({ isOpen: true, venda, motivo: '' });
    };

    const executeDelete = async () => {
        try {
            await vendaService.cancel(confirmDelete.venda.id, confirmDelete.motivo.trim());
            toast.success('Venda cancelada e estoque devolvido');
            queryClient.invalidateQueries({ queryKey: ['vendas'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['produtos'] });
            queryClient.invalidateQueries({ queryKey: ['produtos-all'] });
            queryClient.invalidateQueries({ queryKey: ['produtos-valor-total'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao excluir venda');
        } finally {
            setConfirmDelete({ isOpen: false, venda: null, motivo: '' });
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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

    const formasPagamento = [
        ['PIX', 'Pix'], ['CARTAO', 'Cartão'], ['DINHEIRO', 'Dinheiro'],
        ['TRANSFERENCIA', 'Transferência'], ['BOLETO', 'Boleto'],
    ];

    const columns = [
        { key: 'id', header: 'ID' },
        {
            key: 'status', header: 'Status',
            render: (row) => row.status === 'CANCELADA'
                ? <span className="status-badge danger">Cancelada</span>
                : <span className="status-badge success"><LuCircleCheck /> Ativa</span>,
        },
        {
            header: 'Data',
            key: 'dataVenda',
            render: (row) => formatDate(row.dataVenda),
        },
        {
            header: 'Cliente',
            key: 'clienteNome',
            render: (row) => row.clienteNome || 'Consumidor',
        },
        {
            header: 'Desconto',
            key: 'desconto',
            render: (row) => row.desconto && parseFloat(row.desconto) > 0
                ? <span className="value-danger">− {formatCurrency(row.desconto)}</span>
                : <span className="text-muted">—</span>,
        },
        {
            header: 'Valor Total',
            key: 'valorTotal',
            render: (row) => (
                <strong className="value-accent">
                    {formatCurrency(row.valorTotal)}
                </strong>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Histórico de Vendas"
                description="Consulte vendas, pagamentos e cancelamentos"
                breadcrumbs={[{ label: 'Vendas' }, { label: 'Histórico' }]}
                actions={<Link className="btn btn-primary" to="/nova-venda"><LuPlus /> Nova venda</Link>}
            />

            <FilterBar
                activeFilters={[
                    statusFiltro && `Status: ${statusFiltro === 'ATIVA' ? 'Ativa' : 'Cancelada'}`,
                    formaFiltro && `Pagamento: ${formasPagamento.find(([value]) => value === formaFiltro)?.[1]}`,
                    inicioFiltro && `A partir de ${new Date(`${inicioFiltro}T00:00:00`).toLocaleDateString('pt-BR')}`,
                    fimFiltro && `Até ${new Date(`${fimFiltro}T00:00:00`).toLocaleDateString('pt-BR')}`,
                ].filter(Boolean)}
                onClear={() => { setStatusFiltro(''); setFormaFiltro(''); setInicioFiltro(''); setFimFiltro(''); setPage(0); }}
            >
                <select className="filter-input" value={statusFiltro} onChange={(e) => { setStatusFiltro(e.target.value); setPage(0); }} aria-label="Filtrar vendas por status">
                    <option value="">Todos os status</option><option value="ATIVA">Ativas</option><option value="CANCELADA">Canceladas</option>
                </select>
                <select className="filter-input" value={formaFiltro} onChange={(e) => { setFormaFiltro(e.target.value); setPage(0); }} aria-label="Filtrar vendas por pagamento">
                    <option value="">Todos os pagamentos</option>{formasPagamento.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
                <div className="filter-field"><label htmlFor="venda-inicio">De</label><input id="venda-inicio" className="filter-input" type="date" value={inicioFiltro} onChange={(e) => { setInicioFiltro(e.target.value); setPage(0); }} /></div>
                <div className="filter-field"><label htmlFor="venda-fim">Até</label><input id="venda-fim" className="filter-input" min={inicioFiltro} type="date" value={fimFiltro} onChange={(e) => { setFimFiltro(e.target.value); setPage(0); }} /></div>
            </FilterBar>

            <DataTable
                columns={columns}
                data={vendas}
                loading={loading}
                searchPlaceholder="Buscar por cliente..."
                onEdit={(row) => openDetail(row)}
                onDelete={handleDeleteClick}
                pagination={pagination}
                onPageChange={setPage}
                onSearchChange={(value) => { setSearch(value); setPage(0); }}
                editLabel="Detalhes"
                deleteLabel="Cancelar"
                editIcon={<LuEye />}
                deleteIcon={<LuBan />}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Cancelar Venda"
                message={`Tem certeza que deseja cancelar a venda #${confirmDelete.venda?.id}? O histórico será preservado e o estoque será devolvido.`}
                confirmLabel="Confirmar cancelamento"
                promptLabel="Motivo do cancelamento"
                promptValue={confirmDelete.motivo}
                onPromptChange={(motivo) => setConfirmDelete((current) => ({ ...current, motivo }))}
                promptRequired
                onConfirm={executeDelete}
                onClose={() => setConfirmDelete({ isOpen: false, venda: null, motivo: '' })}
            />

            {/* Detail modal */}
            {detailOpen && selectedVenda && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDetailOpen(false)}>
                    <div className="modal venda-detail-modal" role="dialog" aria-modal="true" aria-labelledby="venda-detail-title">
                        <div className="modal-header">
                            <h3 id="venda-detail-title">Venda #{selectedVenda.id}</h3>
                            <button className="modal-close" onClick={() => setDetailOpen(false)} aria-label="Fechar detalhes">
                                <LuX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="venda-detail-grid">
                                <div className="venda-detail-info">
                                    <div className="detail-field">
                                        <label>Data</label>
                                        <p>{formatDate(selectedVenda.dataVenda)}</p>
                                    </div>
                                    <div className="detail-field">
                                        <label>Cliente</label>
                                        <p>{selectedVenda.clienteNome || 'Consumidor'}</p>
                                    </div>
                                    {selectedVenda.status === 'CANCELADA' && (
                                        <div className="detail-field">
                                            <label>Cancelamento</label>
                                            <p>{selectedVenda.motivoCancelamento}</p>
                                            <small>Por {selectedVenda.canceladoPor}</small>
                                        </div>
                                    )}
                                </div>

                                <div className="detail-items-title">Itens</div>

                                {selectedVenda.itens?.map((item) => (
                                    <div className="detail-item" key={item.id}>
                                        <div>
                                            <span className="detail-item-name">{item.produtoNome}</span>
                                            <span className="detail-item-qty">
                                                {' '}
                                                × {item.quantidade} @ {formatCurrency(item.precoUnitario)}
                                            </span>
                                        </div>
                                        <span className="detail-item-sub">
                                            {formatCurrency(item.subtotal)}
                                        </span>
                                    </div>
                                ))}

                                {selectedVenda.desconto && parseFloat(selectedVenda.desconto) > 0 && (
                                    <div className="detail-desconto">
                                        <span>Desconto</span>
                                        <span className="desconto-val">
                                            − {formatCurrency(selectedVenda.desconto)}
                                        </span>
                                    </div>
                                )}

                                <div className="detail-total">
                                    <span>Total</span>
                                    <span className="total-val">
                                        {formatCurrency(selectedVenda.valorTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Vendas;
