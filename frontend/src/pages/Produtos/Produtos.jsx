import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { NumericFormat } from 'react-number-format';
import produtoService from '../../api/produtoService';
import categoriaService from '../../api/categoriaService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import customSelectStyles from '../../utils/selectStyles';

function Produtos() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);

    // Busca paginada para a tabela
    const { data: produtosPage, isLoading: loadingProdutos } = useQuery({
        queryKey: ['produtos', page],
        queryFn: async () => {
            const res = await produtoService.getAll(page, 10);
            return res.data;
        }
    });

    // Busca sem paginação para selects / dropdowns
    const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
        queryKey: ['categorias-all'],
        queryFn: async () => {
            const res = await categoriaService.getAllNoPagination();
            return res.data;
        }
    });

    const produtos = produtosPage?.content || [];
    const pagination = produtosPage ? {
        number: produtosPage.number,
        totalPages: produtosPage.totalPages,
        totalElements: produtosPage.totalElements,
        first: produtosPage.first,
        last: produtosPage.last,
    } : null;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, produto: null });

    const [form, setForm] = useState({
        nome: '',
        descricao: '',
        precoVenda: '',
        quantidadeEstoque: '',
        categoriaId: '',
    });

    const categoriaOptions = categorias.map((cat) => ({
        value: cat.id,
        label: cat.nome
    }));

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
            queryClient.invalidateQueries({ queryKey: ['produtos'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (prod) => {
        setConfirmDelete({ isOpen: true, produto: prod });
    };

    const executeDelete = async () => {
        try {
            await produtoService.delete(confirmDelete.produto.id);
            toast.success('Produto excluído');
            queryClient.invalidateQueries({ queryKey: ['produtos'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao excluir');
        } finally {
            setConfirmDelete({ isOpen: false, produto: null });
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'nome', header: 'Nome' },
        {
            header: 'Categoria',
            key: 'categoriaNome',
            render: (row) => row.categoriaNome || '—'
        },
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
                <p>Faça a gestão do seu stock de bijuterias</p>
            </div>

            <DataTable
                columns={columns}
                data={produtos}
                loading={loadingProdutos || loadingCategorias}
                searchPlaceholder="Procurar produto..."
                onAdd={openNew}
                addLabel="Novo Produto"
                onEdit={openEdit}
                onDelete={handleDeleteClick}
                pagination={pagination}
                onPageChange={setPage}
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
                    <label>Categoria *</label>
                    <Select
                        options={categoriaOptions}
                        value={categoriaOptions.find(c => c.value === form.categoriaId) || null}
                        onChange={(option) => setForm({ ...form, categoriaId: option ? option.value : '' })}
                        placeholder="Selecione ou procure uma categoria..."
                        isSearchable
                        styles={customSelectStyles}
                        noOptionsMessage={() => "Categoria não encontrada"}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Preço de Venda *</label>
                        <NumericFormat
                            value={form.precoVenda}
                            onValueChange={(values) => setForm({ ...form, precoVenda: values.value })}
                            thousandSeparator="."
                            decimalSeparator=","
                            prefix="R$ "
                            decimalScale={2}
                            fixedDecimalScale
                            placeholder="R$ 0,00"
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
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Excluir Produto"
                message={`Tem a certeza que deseja excluir o produto "${confirmDelete.produto?.nome}"?`}
                onConfirm={executeDelete}
                onClose={() => setConfirmDelete({ isOpen: false, produto: null })}
            />
        </div>
    );
}

export default Produtos;