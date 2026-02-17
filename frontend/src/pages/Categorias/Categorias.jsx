import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import categoriaService from '../../api/categoriaService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';

function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [nome, setNome] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await categoriaService.getAll();
            setCategorias(res.data);
        } catch {
            toast.error('Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    };

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
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cat) => {
        if (!window.confirm(`Deseja excluir a categoria "${cat.nome}"?`)) return;
        try {
            await categoriaService.delete(cat.id);
            toast.success('Categoria excluída');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao excluir');
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
                onDelete={handleDelete}
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
        </div>
    );
}

export default Categorias;
