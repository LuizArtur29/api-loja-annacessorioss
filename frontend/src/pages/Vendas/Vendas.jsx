import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LuX } from 'react-icons/lu';
import vendaService from '../../api/vendaService';
import DataTable from '../../components/DataTable/DataTable';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Vendas.css';

function Vendas() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedVenda, setSelectedVenda] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, venda: null, motivo: '' });

    const { data: vendasPage, isLoading: loading } = useQuery({
        queryKey: ['vendas', page, search],
        queryFn: async () => {
            const res = await vendaService.getAll(page, 10, search);
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
                queryKey: ['vendas', page + 1, search],
                queryFn: async () => {
                    const res = await vendaService.getAll(page + 1, 10, search);
                    return res.data;
            },
            staleTime: 60 * 1000,
            });
        }
    }, [vendasPage, page, search, queryClient]);

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

    const columns = [
        { key: 'id', header: 'ID' },
        {
            key: 'status', header: 'Status',
            render: (row) => row.status === 'CANCELADA'
                ? <span style={{ color: 'var(--danger-color)', fontWeight: 600 }}>Cancelada</span>
                : <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>Ativa</span>,
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
                ? <span style={{ color: 'var(--danger-color)', fontWeight: 500 }}>− {formatCurrency(row.desconto)}</span>
                : <span style={{ color: 'var(--text-muted)' }}>—</span>,
        },
        {
            header: 'Valor Total',
            key: 'valorTotal',
            render: (row) => (
                <strong style={{ color: 'var(--accent-color)' }}>
                    {formatCurrency(row.valorTotal)}
                </strong>
            ),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Histórico de Vendas</h2>
                <p>Veja todas as vendas realizadas</p>
            </div>

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
                    <div className="modal" style={{ maxWidth: '520px' }}>
                        <div className="modal-header">
                            <h3>Venda #{selectedVenda.id}</h3>
                            <button className="modal-close" onClick={() => setDetailOpen(false)}>
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
