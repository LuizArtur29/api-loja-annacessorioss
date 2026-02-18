import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LuX } from 'react-icons/lu';
import vendaService from '../../api/vendaService';
import DataTable from '../../components/DataTable/DataTable';
import './Vendas.css';

function Vendas() {
    const [page, setPage] = useState(0);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedVenda, setSelectedVenda] = useState(null);

    const { data: vendasPage, isLoading: loading } = useQuery({
        queryKey: ['vendas', page],
        queryFn: async () => {
            const res = await vendaService.getAll(page, 10);
            return res.data;
        }
    });

    const vendas = vendasPage?.content || [];
    const pagination = vendasPage ? {
        number: vendasPage.number,
        totalPages: vendasPage.totalPages,
        totalElements: vendasPage.totalElements,
        first: vendasPage.first,
        last: vendasPage.last,
    } : null;

    const openDetail = async (venda) => {
        try {
            const res = await vendaService.getById(venda.id);
            setSelectedVenda(res.data);
            setDetailOpen(true);
        } catch {
            toast.error('Erro ao carregar detalhes');
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
                pagination={pagination}
                onPageChange={setPage}
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
