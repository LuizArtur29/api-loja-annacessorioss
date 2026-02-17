import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { NumericFormat } from 'react-number-format';
import Select from 'react-select';
import despesaService from '../../api/despesaService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

function Despesas() {
    const queryClient = useQueryClient();

    const { data: despesas = [], isLoading: loading } = useQuery({
        queryKey: ['despesas'],
        queryFn: async () => {
            const res = await despesaService.getAll();
            return res.data;
        }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, despesa: null });

    const [form, setForm] = useState({
        descricao: '',
        valor: '',
        dataPagamento: '',
        categoria: ''
    });

    // Opções de categorias que definimos no Enum do Spring Boot
    const categoriaOptions = [
        { value: 'MERCADORIA', label: 'Mercadorias e Estoque' },
        { value: 'EMBALAGEM', label: 'Embalagens e Envios' },
        { value: 'CUSTO_FIXO', label: 'Custos Fixos (Luz, Água, Internet)' },
        { value: 'MARKETING', label: 'Marketing e Anúncios' },
        { value: 'IMPOSTO', label: 'Impostos e Taxas' },
        { value: 'OUTROS', label: 'Outros' }
    ];

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: 'var(--surface-secondary)',
            borderColor: state.isFocused ? 'var(--accent-color)' : 'var(--border-color)',
            borderRadius: '10px',
            minHeight: '42px',
            boxShadow: 'none',
            '&:hover': { borderColor: state.isFocused ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.15)' },
            cursor: 'pointer'
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: 'var(--surface-primary)',
            border: `1px solid var(--border-color)`,
            borderRadius: '8px',
            zIndex: 9999
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? 'var(--surface-hover)' : 'transparent',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            '&:active': { backgroundColor: 'var(--accent-alpha)' }
        }),
        singleValue: (provided) => ({ ...provided, color: 'var(--text-primary)' }),
        placeholder: (provided) => ({ ...provided, color: 'var(--text-muted)' })
    };

    const openNew = () => {
        setForm({
            descricao: '',
            valor: '',
            dataPagamento: new Date().toISOString().split('T')[0],
            categoria: ''
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.descricao.trim() || !form.valor || !form.dataPagamento || !form.categoria) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }
        setSaving(true);
        try {
            await despesaService.create({
                ...form,
                valor: parseFloat(form.valor)
            });
            toast.success('Despesa registada');
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['despesas'] });
        } catch (err) {
            toast.error('Erro ao salvar despesa');
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
        } catch (err) {
            toast.error('Erro ao excluir');
        } finally {
            setConfirmDelete({ isOpen: false, despesa: null });
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const getCategoriaLabel = (value) => {
        const cat = categoriaOptions.find(c => c.value === value);
        return cat ? cat.label : value;
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'descricao', header: 'Descrição' },
        {
            key: 'categoria',
            header: 'Categoria',
            render: (row) => (
                <span style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85rem'
                }}>
                    {getCategoriaLabel(row.categoria)}
                </span>
            )
        },
        {
            key: 'valor',
            header: 'Valor',
            render: (row) => (
                <span style={{ color: 'var(--danger-color)', fontWeight: '500' }}>
                    {formatCurrency(row.valor)}
                </span>
            ),
        },
        {
            key: 'dataPagamento',
            header: 'Data de Pagamento',
            render: (row) => formatDate(row.dataPagamento),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Despesas</h2>
                <p>Faça a gestão das contas e gastos da loja</p>
            </div>

            <DataTable
                columns={columns}
                data={despesas}
                loading={loading}
                searchPlaceholder="Procurar despesa..."
                onAdd={openNew}
                addLabel="Nova Despesa"
                onDelete={handleDelete}
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Registar Nova Despesa"
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

                <div className="form-group">
                    <label>Categoria *</label>
                    <Select
                        options={categoriaOptions}
                        value={categoriaOptions.find(c => c.value === form.categoria) || null}
                        onChange={(option) => setForm({ ...form, categoria: option ? option.value : '' })}
                        placeholder="Selecione a categoria..."
                        isSearchable={false}
                        styles={customSelectStyles}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Valor *</label>
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
                        <label>Data de Pagamento *</label>
                        <input
                            type="date"
                            name="dataPagamento"
                            value={form.dataPagamento}
                            onChange={(e) => setForm({ ...form, dataPagamento: e.target.value })}
                        />
                    </div>
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