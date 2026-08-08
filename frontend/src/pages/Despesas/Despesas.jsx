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
import { LuCircleCheck, LuClock3, LuPlus, LuTriangleAlert } from 'react-icons/lu';
import PageHeader from '../../components/PageHeader/PageHeader';
import FilterBar from '../../components/FilterBar/FilterBar';

function Despesas() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');

    const now = new Date();
    const [mesFiltro, setMesFiltro] = useState(now.getMonth() + 1);
    const [anoFiltro, setAnoFiltro] = useState(now.getFullYear());
    const [statusFiltro, setStatusFiltro] = useState('');
    const [formaFiltro, setFormaFiltro] = useState('');
    const [inicioFiltro, setInicioFiltro] = useState('');
    const [fimFiltro, setFimFiltro] = useState('');

    const { data: despesasPage, isLoading: loading } = useQuery({
        queryKey: ['despesas', page, anoFiltro, mesFiltro, search, statusFiltro, formaFiltro, inicioFiltro, fimFiltro],
        queryFn: async () => {
            const res = await despesaService.getAll(page, 10, anoFiltro, mesFiltro, search, {
                ...(statusFiltro && { status: statusFiltro }),
                ...(formaFiltro && { formaPagamento: formaFiltro }),
                ...(inicioFiltro && { inicio: inicioFiltro }),
                ...(fimFiltro && { fim: fimFiltro }),
            });
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
        { value: 'PAGO', label: 'Pago', Icon: LuCircleCheck },
        { value: 'PENDENTE', label: 'Pendente', Icon: LuClock3 },
        { value: 'ATRASADO', label: 'Atrasado', Icon: LuTriangleAlert }
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
            PAGO: { label: 'Pago', className: 'success', Icon: LuCircleCheck },
            PENDENTE: { label: 'Pendente', className: 'pending', Icon: LuClock3 },
            ATRASADO: { label: 'Atrasado', className: 'danger', Icon: LuTriangleAlert }
        };
        const s = map[status] || map.PENDENTE;
        return (
            <span className={`status-badge ${s.className}`}>
                <s.Icon /> {s.label}
            </span>
        );
    };

    const getFormaPgtoLabel = (value) => {
        const f = formaPagamentoOptions.find(o => o.value === value);
        return f ? f.label : '—';
    };

    const formValid = form.descricao.trim() && Number(form.valor) > 0 && form.dataPagamento
        && form.categoria && Number(form.parcelas || 1) >= 1;

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
                <span className="category-badge">
                    {getCategoriaLabel(row.categoria)}
                </span>
            )
        },
        {
            key: 'valor', header: 'Valor',
            render: (row) => (
                <span className="value-danger">
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
                    <span className="installment-badge">
                        {row.parcelaAtual}/{row.parcelas}
                    </span>
                ) : '—'
        },
    ];

    return (
        <div>
            <PageHeader
                title="Despesas"
                description="Acompanhe contas, vencimentos e gastos da loja"
                breadcrumbs={[{ label: 'Financeiro' }, { label: 'Despesas' }]}
                actions={<button className="btn btn-primary" onClick={openNew}><LuPlus /> Nova despesa</button>}
            />

            <FilterBar
                activeFilters={[
                    statusFiltro && `Status: ${statusOptions.find((item) => item.value === statusFiltro)?.label}`,
                    formaFiltro && `Pagamento: ${getFormaPgtoLabel(formaFiltro)}`,
                    inicioFiltro && `De: ${formatDate(inicioFiltro)}`,
                    fimFiltro && `Até: ${formatDate(fimFiltro)}`,
                ].filter(Boolean)}
                onClear={() => { setStatusFiltro(''); setFormaFiltro(''); setInicioFiltro(''); setFimFiltro(''); setPage(0); }}
            >
                <div className="filter-field"><label htmlFor="despesa-mes">Período</label>
                <select
                    id="despesa-mes"
                    value={mesFiltro}
                    onChange={(e) => { setMesFiltro(Number(e.target.value)); setPage(0); }}
                    className="filter-input"
                >
                    {meses.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
                <select
                    value={anoFiltro}
                    onChange={(e) => { setAnoFiltro(Number(e.target.value)); setPage(0); }}
                    className="filter-input"
                >
                    {anos.map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
                </div>
                <select className="filter-input" aria-label="Filtrar por status" value={statusFiltro} onChange={(e) => { setStatusFiltro(e.target.value); setPage(0); }}>
                    <option value="">Todos os status</option>{statusOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
                </select>
                <select className="filter-input" aria-label="Filtrar por pagamento" value={formaFiltro} onChange={(e) => { setFormaFiltro(e.target.value); setPage(0); }}>
                    <option value="">Todos os pagamentos</option>{formaPagamentoOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
                </select>
                <div className="filter-field"><label htmlFor="despesa-inicio">De</label><input id="despesa-inicio" className="filter-input" type="date" value={inicioFiltro} onChange={(e) => { setInicioFiltro(e.target.value); setPage(0); }} /></div>
                <div className="filter-field"><label htmlFor="despesa-fim">Até</label><input id="despesa-fim" className="filter-input" type="date" min={inicioFiltro} value={fimFiltro} onChange={(e) => { setFimFiltro(e.target.value); setPage(0); }} /></div>
            </FilterBar>

            <DataTable
                columns={columns}
                data={despesas}
                loading={loading}
                searchPlaceholder="Procurar despesa..."
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
                submitDisabled={!formValid}
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
                    {!form.descricao.trim() && <span className="form-error">Informe uma descrição.</span>}
                </div>

                <div className="form-grid form-grid-2">
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
                            formatOptionLabel={({ label, Icon }) => (
                                <span className="select-option-icon"><Icon />{label}</span>
                            )}
                        />
                    </div>
                </div>

                <div className="form-grid form-grid-2">
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
                    <div className="form-grid form-grid-2">
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
                        <div className="installment-preview">
                            {parseInt(form.parcelas) > 1 && form.valor && (
                                <span>
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

                <div className="form-grid">
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
