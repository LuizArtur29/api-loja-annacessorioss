import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { NumericFormat } from 'react-number-format';
import Select from 'react-select';
import despesaService from '../../api/despesaService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import customSelectStyles from '../../utils/selectStyles';

function Despesas() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');

    const now = new Date();
    const [mesFiltro, setMesFiltro] = useState(now.getMonth() + 1);
    const [anoFiltro, setAnoFiltro] = useState(now.getFullYear());

    const { data: despesasPage, isLoading: loading } = useQuery({
        queryKey: ['despesas', page, anoFiltro, mesFiltro, search],
        queryFn: async () => {
            const res = await despesaService.getAll(page, 10, anoFiltro, mesFiltro, search);
            return res.data;
        }
    });

    const despesas = despesasPage?.content || [];
    const pagination = despesasPage ? {
        number: despesasPage.number,
        totalPages: despesasPage.totalPages,
        totalElements: despesasPage.totalElements,
        first: despesasPage.first,
        last: despesasPage.last,
    } : null;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, despesa: null });

    const [form, setForm] = useState({
        descricao: '',
        valor: '',
        dataPagamento: '',
        categoria: '',
        status: 'PENDENTE',
        formaPagamento: '',
        observacoes: '',
        parcelas: 1
    });

    /* ── Opções de Select ── */
    const categoriaOptions = [
        { value: 'MERCADORIA', label: 'Mercadorias e Estoque' },
        { value: 'EMBALAGEM', label: 'Embalagens e Envios' },
        { value: 'CUSTO_FIXO', label: 'Custos Fixos (Luz, Água, Internet)' },
        { value: 'MARKETING', label: 'Marketing e Anúncios' },
        { value: 'IMPOSTO', label: 'Impostos e Taxas' },
        { value: 'OUTROS', label: 'Outros' }
    ];

    const statusOptions = [
        { value: 'PAGO', label: '✅ Pago' },
        { value: 'PENDENTE', label: '🕐 Pendente' },
        { value: 'ATRASADO', label: '⚠️ Atrasado' }
    ];

    const formaPagamentoOptions = [
        { value: 'PIX', label: 'Pix' },
        { value: 'CARTAO', label: 'Cartão' },
        { value: 'DINHEIRO', label: 'Dinheiro' },
        { value: 'TRANSFERENCIA', label: 'Transferência' },
        { value: 'BOLETO', label: 'Boleto' }
    ];



    /* ── Handlers ── */
    const openNew = () => {
        setEditing(null);
        setForm({
            descricao: '',
            valor: '',
            dataPagamento: new Date().toISOString().split('T')[0],
            categoria: '',
            status: 'PENDENTE',
            formaPagamento: '',
            observacoes: '',
            parcelas: 1
        });
        setModalOpen(true);
    };

    const openEdit = (desp) => {
        setEditing(desp);
        setForm({
            descricao: desp.descricao,
            valor: desp.valor,
            dataPagamento: desp.dataPagamento,
            categoria: desp.categoria || '',
            status: desp.status || 'PENDENTE',
            formaPagamento: desp.formaPagamento || '',
            observacoes: desp.observacoes || ''
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.descricao.trim() || !form.valor || !form.dataPagamento || !form.categoria) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }
        setSaving(true);
        const payload = {
            ...form,
            valor: parseFloat(form.valor),
            formaPagamento: form.formaPagamento || null,
            parcelas: editing ? undefined : (parseInt(form.parcelas) || 1)
        };
        try {
            if (editing) {
                await despesaService.update(editing.id, payload);
                toast.success('Despesa atualizada');
            } else {
                await despesaService.create(payload);
                const qtd = parseInt(form.parcelas) || 1;
                toast.success(qtd > 1 ? `${qtd} parcelas registradas!` : 'Despesa registrada');
            }
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['despesas'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao salvar despesa');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (despesa) => {
        setConfirmDelete({ isOpen: true, despesa });
    };

    const executeDelete = async () => {
        try {
            await despesaService.delete(confirmDelete.despesa.id);
            toast.success('Despesa excluída');
            queryClient.invalidateQueries({ queryKey: ['despesas'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        } catch {
            toast.error('Erro ao excluir');
        } finally {
            setConfirmDelete({ isOpen: false, despesa: null });
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const getCategoriaLabel = (value) => {
        const cat = categoriaOptions.find(c => c.value === value);
        return cat ? cat.label : value || '—';
    };

    const getStatusBadge = (status) => {
        const map = {
            PAGO: { label: 'Pago', color: 'var(--success-color)', bg: 'var(--success-bg)' },
            PENDENTE: { label: 'Pendente', color: 'var(--accent-dark)', bg: 'var(--accent-alpha)' },
            ATRASADO: { label: 'Atrasado', color: 'var(--danger-color)', bg: 'var(--danger-bg)' }
        };
        const s = map[status] || map.PENDENTE;
        return (
            <span style={{
                background: s.bg, color: s.color,
                padding: '3px 10px', borderRadius: '12px',
                fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
                whiteSpace: 'nowrap'
            }}>
                {s.label}
            </span>
        );
    };

    const getFormaPgtoLabel = (value) => {
        const f = formaPagamentoOptions.find(o => o.value === value);
        return f ? f.label : '—';
    };

    /* ── Meses para o seletor ── */
    const meses = [
        { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
    ];

    const anos = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) anos.push(y);

    /* ── Colunas da tabela ── */
    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'descricao', header: 'Descrição' },
        {
            key: 'categoria', header: 'Categoria',
            render: (row) => (
                <span style={{
                    background: 'var(--accent-alpha)', padding: '3px 8px',
                    borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-primary)'
                }}>
                    {getCategoriaLabel(row.categoria)}
                </span>
            )
        },
        {
            key: 'valor', header: 'Valor',
            render: (row) => (
                <span style={{ color: 'var(--danger-color)', fontWeight: '600' }}>
                    {formatCurrency(row.valor)}
                </span>
            ),
        },
        {
            key: 'status', header: 'Status',
            render: (row) => getStatusBadge(row.status)
        },
        {
            key: 'formaPagamento', header: 'Forma Pgto',
            render: (row) => getFormaPgtoLabel(row.formaPagamento)
        },
        {
            key: 'dataPagamento', header: 'Data',
            render: (row) => formatDate(row.dataPagamento),
        },
        {
            key: 'parcela', header: 'Parcela',
            render: (row) => row.parcelas > 1
                ? (
                    <span style={{
                        background: 'var(--accent-alpha)', color: 'var(--accent-dark)',
                        padding: '3px 8px', borderRadius: '10px',
                        fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif'
                    }}>
                        {row.parcelaAtual}/{row.parcelas}
                    </span>
                ) : '—'
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Despesas</h2>
                <p>Faça a gestão das contas e gastos da loja</p>
            </div>

            {/* ── Filtros de Mês/Ano ── */}
            <div style={{
                display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <span style={{
                    fontSize: '0.82rem', color: 'var(--text-secondary)',
                    fontWeight: 600, fontFamily: 'Outfit, sans-serif'
                }}>
                    Período:
                </span>
                <select
                    value={mesFiltro}
                    onChange={(e) => { setMesFiltro(Number(e.target.value)); setPage(0); }}
                    style={{
                        padding: '6px 12px', borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--surface-primary)',
                        color: 'var(--text-primary)', fontSize: '0.88rem',
                        fontFamily: 'Outfit, sans-serif', cursor: 'pointer'
                    }}
                >
                    {meses.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
                <select
                    value={anoFiltro}
                    onChange={(e) => { setAnoFiltro(Number(e.target.value)); setPage(0); }}
                    style={{
                        padding: '6px 12px', borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--surface-primary)',
                        color: 'var(--text-primary)', fontSize: '0.88rem',
                        fontFamily: 'Outfit, sans-serif', cursor: 'pointer'
                    }}
                >
                    {anos.map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
            </div>

            <DataTable
                columns={columns}
                data={despesas}
                loading={loading}
                searchPlaceholder="Procurar despesa..."
                onAdd={openNew}
                addLabel="Nova Despesa"
                onEdit={openEdit}
                onDelete={handleDelete}
                pagination={pagination}
                onPageChange={setPage}
                onSearchChange={(value) => { setSearch(value); setPage(0); }}
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Despesa' : 'Registrar Nova Despesa'}
                onSubmit={handleSubmit}
                loading={saving}
            >
                <div className="form-group">
                    <label>Descrição *</label>
                    <input
                        type="text"
                        name="descricao"
                        value={form.descricao}
                        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                        placeholder="Ex: Conta de Luz, Fitas para envio..."
                        autoFocus
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Categoria *</label>
                        <Select
                            options={categoriaOptions}
                            value={categoriaOptions.find(c => c.value === form.categoria) || null}
                            onChange={(option) => setForm({ ...form, categoria: option ? option.value : '' })}
                            placeholder="Selecione..."
                            isSearchable={false}
                            styles={customSelectStyles}
                        />
                    </div>
                    <div className="form-group">
                        <label>Status *</label>
                        <Select
                            options={statusOptions}
                            value={statusOptions.find(s => s.value === form.status) || statusOptions[1]}
                            onChange={(option) => setForm({ ...form, status: option ? option.value : 'PENDENTE' })}
                            isSearchable={false}
                            styles={customSelectStyles}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Valor Total *</label>
                        <NumericFormat
                            value={form.valor}
                            onValueChange={(values) => setForm({ ...form, valor: values.value })}
                            thousandSeparator="."
                            decimalSeparator=","
                            prefix="R$ "
                            decimalScale={2}
                            fixedDecimalScale
                            placeholder="R$ 0,00"
                        />
                    </div>
                    <div className="form-group">
                        <label>Data *</label>
                        <input
                            type="date"
                            name="dataPagamento"
                            value={form.dataPagamento}
                            onChange={(e) => setForm({ ...form, dataPagamento: e.target.value })}
                        />
                    </div>
                </div>

                {!editing && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Parcelas</label>
                            <input
                                type="number"
                                min="1"
                                max="48"
                                value={form.parcelas}
                                onChange={(e) => setForm({ ...form, parcelas: e.target.value })}
                                placeholder="1"
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                            {parseInt(form.parcelas) > 1 && form.valor && (
                                <span style={{
                                    fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem',
                                    color: 'var(--accent-dark)', fontWeight: 500
                                }}>
                                    {parseInt(form.parcelas)}x de{' '}
                                    <strong>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                                            .format(parseFloat(form.valor) / parseInt(form.parcelas))}
                                    </strong>
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Forma de Pagamento</label>
                        <Select
                            options={formaPagamentoOptions}
                            value={formaPagamentoOptions.find(f => f.value === form.formaPagamento) || null}
                            onChange={(option) => setForm({ ...form, formaPagamento: option ? option.value : '' })}
                            placeholder="Selecione (opcional)..."
                            isClearable
                            isSearchable={false}
                            styles={customSelectStyles}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Observações</label>
                    <textarea
                        name="observacoes"
                        value={form.observacoes}
                        onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                        placeholder="Anotações opcionais sobre esta despesa..."
                        rows={3}
                    />
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Excluir Despesa"
                message={`Deseja excluir a despesa "${confirmDelete.despesa?.descricao}"?`}
                onConfirm={executeDelete}
                onClose={() => setConfirmDelete({ isOpen: false, despesa: null })}
            />
        </div>
    );
}

export default Despesas;
