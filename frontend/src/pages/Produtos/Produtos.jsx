import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import CurrencyInput from 'react-currency-input-field';
import produtoService from '../../api/produtoService';
import categoriaService from '../../api/categoriaService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';


function Produtos() {
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, cliente: null });

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

    const handleDelete = (cli) => {
        setConfirmDelete({ isOpen: true, cliente: cli });
    };

    // Esta é a função que o botão "Sim, Excluir" do modal vai chamar
    const executeDelete = async () => {
        const cli = confirmDelete.cliente;
        try {
            await clienteService.delete(cli.id);
            toast.success('Cliente excluído');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao excluir');
        } finally {
            setConfirmDelete({ isOpen: false, cliente: null }); // Fecha o modal
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
                    <CurrencyInput
                        name="precoVenda"
                        value={form.precoVenda}
                        onValueChange={(value) => setForm({ ...form, precoVenda: value })}
                        placeholder="R$ 0,00"
                        prefix="R$ "
                        decimalsLimit={2}
                        decimalSeparator=","
                        groupSeparator="."
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
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Excluir Cliente"
                message={`Tem certeza que deseja excluir o cliente "${confirmDelete.cliente?.nome}"?`}
                onConfirm={executeDelete}
                onClose={() => setConfirmDelete({ isOpen: false, cliente: null })}
            />
        </div>
    );
}

export default Produtos;
