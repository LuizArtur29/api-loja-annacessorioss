import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PatternFormat } from 'react-number-format';
import clienteService from '../../api/clienteService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import PageHeader from '../../components/PageHeader/PageHeader';
import { LuPlus } from 'react-icons/lu';

function Clientes() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');

    const { data: clientesPage, isLoading: loading } = useQuery({
        queryKey: ['clientes', page, search],
        queryFn: async () => {
            const res = await clienteService.getAll(page, 10, search);
            return res.data;
        }
    });

    const clientes = clientesPage?.content || [];
    const pagination = clientesPage ? {
        number: clientesPage.number,
        totalPages: clientesPage.totalPages,
        totalElements: clientesPage.totalElements,
        first: clientesPage.first,
        last: clientesPage.last,
    } : null;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ nome: '', telefone: '', dataNascimento: '' });

    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, cliente: null });

    const openNew = () => {
        setEditing(null);
        setForm({ nome: '', telefone: '', dataNascimento: '' });
        setModalOpen(true);
    };

    const openEdit = (cli) => {
        setEditing(cli);
        setForm({
            nome: cli.nome,
            telefone: cli.telefone || '',
            dataNascimento: cli.dataNascimento || '',
        });
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
        const payload = {
            ...form,
            dataNascimento: form.dataNascimento || null,
        };
        try {
            if (editing) {
                await clienteService.update(editing.id, payload);
                toast.success('Cliente atualizado');
            } else {
                await clienteService.create(payload);
                toast.success('Cliente cadastrado');
            }
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            queryClient.invalidateQueries({ queryKey: ['clientes-all'] });
            queryClient.invalidateQueries({ queryKey: ['clientes-aniversariantes'] });
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
            queryClient.invalidateQueries({ queryKey: ['clientes-all'] });
            queryClient.invalidateQueries({ queryKey: ['clientes-aniversariantes'] });
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
        {
            key: 'dataNascimento',
            header: 'Nascimento',
            render: (row) => row.dataNascimento
                ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${row.dataNascimento}T00:00:00Z`))
                : '—',
        },
    ];
    const formValid = form.nome.trim().length >= 2;

    return (
        <div>
            <PageHeader
                title="Clientes"
                description="Mantenha os dados e aniversários dos seus clientes organizados"
                breadcrumbs={[{ label: 'Cadastros' }, { label: 'Clientes' }]}
                actions={<button className="btn btn-primary" onClick={openNew}><LuPlus /> Novo cliente</button>}
            />

            <DataTable
                columns={columns}
                data={clientes}
                loading={loading}
                searchPlaceholder="Buscar cliente..."
                onEdit={openEdit}
                onDelete={handleDelete}
                pagination={pagination}
                onPageChange={setPage}
                onSearchChange={(value) => { setSearch(value); setPage(0); }}
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Cliente' : 'Novo Cliente'}
                onSubmit={handleSubmit}
                loading={saving}
                submitDisabled={!formValid}
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
                    {!formValid && <span className="form-error">Informe um nome com pelo menos 2 caracteres.</span>}
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
                <div className="form-group">
                    <label>Data de nascimento</label>
                    <input
                        type="date"
                        name="dataNascimento"
                        value={form.dataNascimento}
                        onChange={handleChange}
                        max={(() => {
                            const now = new Date();
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            const day = String(now.getDate()).padStart(2, '0');
                            return `${now.getFullYear()}-${month}-${day}`;
                        })()}
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
