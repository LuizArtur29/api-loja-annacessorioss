import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PatternFormat } from 'react-number-format';
import clienteService from '../../api/clienteService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

function Clientes() {
    const queryClient = useQueryClient();

    const { data: clientes = [], isLoading: loading } = useQuery({
        queryKey: ['clientes'],
        queryFn: async () => {
            const res = await clienteService.getAll();
            return res.data;
        }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ nome: '', telefone: '' });

    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, cliente: null });

    const openNew = () => {
        setEditing(null);
        setForm({ nome: '', telefone: '' });
        setModalOpen(true);
    };

    const openEdit = (cli) => {
        setEditing(cli);
        setForm({ nome: cli.nome, telefone: cli.telefone || '' });
        setModalOpen(true);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!form.nome.trim()) {
            toast.error('O nome é obrigatório');
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await clienteService.update(editing.id, form);
                toast.success('Cliente atualizado');
            } else {
                await clienteService.create(form);
                toast.success('Cliente cadastrado');
            }
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (cli) => {
        setConfirmDelete({ isOpen: true, cliente: cli });
    };

    const executeDelete = async () => {
        const cli = confirmDelete.cliente;
        try {
            await clienteService.delete(cli.id);
            toast.success('Cliente excluído');
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao excluir');
        } finally {
            setConfirmDelete({ isOpen: false, cliente: null });
        }
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'nome', header: 'Nome' },
        {
            key: 'telefone',
            header: 'Telefone',
            render: (row) => row.telefone || '—',
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Clientes</h2>
                <p>Gerencie os seus clientes</p>
            </div>

            <DataTable
                columns={columns}
                data={clientes}
                loading={loading}
                searchPlaceholder="Buscar cliente..."
                onAdd={openNew}
                addLabel="Novo Cliente"
                onEdit={openEdit}
                onDelete={handleDelete}
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Cliente' : 'Novo Cliente'}
                onSubmit={handleSubmit}
                loading={saving}
            >
                <div className="form-group">
                    <label>Nome *</label>
                    <input
                        type="text"
                        name="nome"
                        value={form.nome}
                        onChange={handleChange}
                        placeholder="Nome do cliente"
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label>Telefone</label>
                    <PatternFormat
                        format="(##) #####-####"
                        name="telefone"
                        value={form.telefone}
                        onValueChange={(values) => {
                            setForm({ ...form, telefone: values.formattedValue });
                        }}
                        placeholder="(00) 00000-0000"
                    />
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Excluir Cliente"
                message={`Tem a certeza que deseja excluir o cliente "${confirmDelete.cliente?.nome}"?`}
                onConfirm={executeDelete}
                onClose={() => setConfirmDelete({ isOpen: false, cliente: null })}
            />
        </div>
    );
}

export default Clientes;