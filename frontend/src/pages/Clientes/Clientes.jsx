import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import clienteService from '../../api/clienteService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({ nome: '', telefone: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await clienteService.getAll();
            setClientes(res.data);
        } catch {
            toast.error('Erro ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

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
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cli) => {
        if (!window.confirm(`Deseja excluir o cliente "${cli.nome}"?`)) return;
        try {
            await clienteService.delete(cli.id);
            toast.success('Cliente excluído');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao excluir');
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
                <p>Gerencie seus clientes</p>
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
                    <input
                        type="text"
                        name="telefone"
                        value={form.telefone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                    />
                </div>
            </Modal>
        </div>
    );
}

export default Clientes;
