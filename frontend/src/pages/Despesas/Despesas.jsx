import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { NumericFormat } from 'react-number-format';
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
    const [form, setForm] = useState({ descricao: '', valor: '', dataPagamento: '' });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, despesa: null });

    const openNew = () => {
        setForm({ descricao: '', valor: '', dataPagamento: new Date().toISOString().split('T')[0] });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.descricao.trim() || !form.valor || !form.dataPagamento) {
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

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'descricao', header: 'Descrição' },
        {
            key: 'valor',
            header: 'Valor',
            render: (row) => (
                <span style={{ color: 'var(--danger-color, #ef4444)', fontWeight: '500' }}>
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
                searchPlaceholder="Buscar despesa..."
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
                        placeholder="Ex: Água, Luz, Embalagens..."
                        autoFocus
                    />
                </div>
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