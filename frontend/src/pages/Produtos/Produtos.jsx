import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import produtoService from '../../api/produtoService';
import categoriaService from '../../api/categoriaService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';

function Produtos() {
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        nome: '',
        descricao: '',
        precoVenda: '',
        quantidadeEstoque: '',
        categoriaId: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                produtoService.getAll(),
                categoriaService.getAll(),
            ]);
            setProdutos(prodRes.data);
            setCategorias(catRes.data);
        } catch {
            toast.error('Erro ao carregar produtos');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () =>
        setForm({ nome: '', descricao: '', precoVenda: '', quantidadeEstoque: '', categoriaId: '' });

    const openNew = () => {
        setEditing(null);
        resetForm();
        setModalOpen(true);
    };

    const openEdit = (prod) => {
        setEditing(prod);
        setForm({
            nome: prod.nome,
            descricao: prod.descricao || '',
            precoVenda: prod.precoVenda,
            quantidadeEstoque: prod.quantidadeEstoque,
            categoriaId: prod.categoriaId,
        });
        setModalOpen(true);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!form.nome.trim() || !form.precoVenda || !form.categoriaId) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }
        setSaving(true);
        const payload = {
            ...form,
            precoVenda: parseFloat(form.precoVenda),
            quantidadeEstoque: parseInt(form.quantidadeEstoque) || 0,
            categoriaId: parseInt(form.categoriaId),
        };
        try {
            if (editing) {
                await produtoService.update(editing.id, payload);
                toast.success('Produto atualizado');
            } else {
                await produtoService.create(payload);
                toast.success('Produto criado');
            }
            setModalOpen(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (prod) => {
        if (!window.confirm(`Deseja excluir o produto "${prod.nome}"?`)) return;
        try {
            await produtoService.delete(prod.id);
            toast.success('Produto excluído');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao excluir');
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'nome', header: 'Nome' },
        { key: 'categoriaNome', header: 'Categoria' },
        {
            header: 'Preço',
            key: 'precoVenda',
            render: (row) => formatCurrency(row.precoVenda),
        },
        {
            header: 'Estoque',
            key: 'quantidadeEstoque',
            render: (row) => (
                <span
                    style={{
                        color: row.quantidadeEstoque <= 5 ? 'var(--danger-color)' : 'var(--text-primary)',
                        fontWeight: row.quantidadeEstoque <= 5 ? 700 : 400,
                    }}
                >
                    {row.quantidadeEstoque}
                </span>
            ),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Produtos</h2>
                <p>Gerencie seu estoque de bijuterias</p>
            </div>

            <DataTable
                columns={columns}
                data={produtos}
                loading={loading}
                searchPlaceholder="Buscar produto..."
                onAdd={openNew}
                addLabel="Novo Produto"
                onEdit={openEdit}
                onDelete={handleDelete}
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Produto' : 'Novo Produto'}
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
                        placeholder="Nome do produto"
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label>Descrição</label>
                    <textarea
                        name="descricao"
                        value={form.descricao}
                        onChange={handleChange}
                        placeholder="Descrição opcional"
                    />
                </div>
                <div className="form-group">
                    <label>Preço de Venda *</label>
                    <input
                        type="number"
                        name="precoVenda"
                        value={form.precoVenda}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                    />
                </div>
                <div className="form-group">
                    <label>Quantidade em Estoque *</label>
                    <input
                        type="number"
                        name="quantidadeEstoque"
                        value={form.quantidadeEstoque}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                    />
                </div>
                <div className="form-group">
                    <label>Categoria *</label>
                    <select
                        name="categoriaId"
                        value={form.categoriaId}
                        onChange={handleChange}
                    >
                        <option value="">Selecione...</option>
                        {categorias.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nome}
                            </option>
                        ))}
                    </select>
                </div>
            </Modal>
        </div>
    );
}

export default Produtos;
