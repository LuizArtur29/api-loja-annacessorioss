import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import categoriaService from '../../api/categoriaService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

function Categorias() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);

    const { data: categoriasPage, isLoading: loading } = useQuery({
        queryKey: ['categorias', page],
        queryFn: async () => {
            const res = await categoriaService.getAll(page, 10);
            return res.data;
        }
    });

    const categorias = categoriasPage?.content || [];
    const pagination = categoriasPage ? {
        number: categoriasPage.number,
        totalPages: categoriasPage.totalPages,
        totalElements: categoriasPage.totalElements,
        first: categoriasPage.first,
        last: categoriasPage.last,
    } : null;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [nome, setNome] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, categoria: null });

    const openNew = () => {
        setEditing(null);
        setNome('');
        setModalOpen(true);
    };

    const openEdit = (cat) => {
        setEditing(cat);
        setNome(cat.nome);
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!nome.trim()) {
            toast.error('O nome é obrigatório');
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await categoriaService.update(editing.id, { nome });
                toast.success('Categoria atualizada');
            } else {
                await categoriaService.create({ nome });
                toast.success('Categoria criada');
            }
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['categorias'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (cat) => {
        setConfirmDelete({ isOpen: true, categoria: cat });
    };

    const executeDelete = async () => {
        try {
            await categoriaService.delete(confirmDelete.categoria.id);
            toast.success('Categoria excluída');
            queryClient.invalidateQueries({ queryKey: ['categorias'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao excluir');
        } finally {
            setConfirmDelete({ isOpen: false, categoria: null });
        }
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'nome', header: 'Nome' },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Categorias</h2>
                <p>Gerencie as categorias de produtos</p>
            </div>

            <DataTable
                columns={columns}
                data={categorias}
                loading={loading}
                searchPlaceholder="Buscar categoria..."
                onAdd={openNew}
                addLabel="Nova Categoria"
                onEdit={openEdit}
                onDelete={handleDeleteClick}
                pagination={pagination}
                onPageChange={setPage}
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Categoria' : 'Nova Categoria'}
                onSubmit={handleSubmit}
                loading={saving}
            >
                <div className="form-group">
                    <label>Nome</label>
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Nome da categoria"
                        autoFocus
                    />
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Excluir Categoria"
                message={`Tem a certeza que deseja excluir a categoria "${confirmDelete.categoria?.nome}"?`}
                onConfirm={executeDelete}
                onClose={() => setConfirmDelete({ isOpen: false, categoria: null })}
            />
        </div>
    );
}

export default Categorias;
