import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { NumericFormat } from 'react-number-format';
import { useSearchParams } from 'react-router-dom';
import { LuGem, LuPlus, LuTriangleAlert } from 'react-icons/lu';
import produtoService from '../../api/produtoService';
import categoriaService from '../../api/categoriaService';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import customSelectStyles from '../../utils/selectStyles';
import PageHeader from '../../components/PageHeader/PageHeader';

function Produtos() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(0);
    const initialProductSearch = searchParams.get('produto') || '';
    const [search, setSearch] = useState(initialProductSearch);
    const categoriaIdParam = Number(searchParams.get('categoriaId'));
    const categoriaId = Number.isInteger(categoriaIdParam) && categoriaIdParam > 0
        ? categoriaIdParam
        : null;
    const categoriaNome = searchParams.get('categoriaNome');
    const estoqueMax = searchParams.get('estoque') === 'baixo' ? 5 : null;

    // Busca paginada para a tabela
    const { data: produtosPage, isLoading: loadingProdutos } = useQuery({
        queryKey: ['produtos', page, search, categoriaId, estoqueMax],
        queryFn: async () => {
            const res = await produtoService.getAll(page, 10, search, categoriaId, estoqueMax);
            return res.data;
        },
        staleTime: 60 * 1000,
    });

    // Busca sem paginação para selects / dropdowns
    const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
        queryKey: ['categorias-all'],
        queryFn: async () => {
            const res = await categoriaService.getAllNoPagination();
            return res.data;
        }
    });

    // Valor total do estoque
    const { data: valorTotalEstoque } = useQuery({
        queryKey: ['produtos-valor-total'],
        queryFn: async () => {
            const res = await produtoService.getValorTotal();
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

    useEffect(() => {
        if (produtosPage && !produtosPage.last) {
            queryClient.prefetchQuery({
                queryKey: ['produtos', page + 1, search, categoriaId, estoqueMax],
                queryFn: async () => {
                    const res = await produtoService.getAll(page + 1, 10, search, categoriaId, estoqueMax);
                    return res.data;
                },
                staleTime: 60 * 1000,
            });
        }
    }, [produtosPage, page, search, categoriaId, estoqueMax, queryClient]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, produto: null });

    const [form, setForm] = useState({
        nome: '',
        codigo: '',
        descricao: '',
        precoVenda: '',
        quantidadeEstoque: '',
        motivoAjuste: '',
        categoriaId: '',
    });

    const categoriaOptions = categorias.map((cat) => ({
        value: cat.id,
        label: cat.nome
    }));

    const resetForm = () =>
        setForm({ nome: '', codigo: '', descricao: '', precoVenda: '', quantidadeEstoque: '', motivoAjuste: '', categoriaId: '' });

    const openNew = () => {
        setEditing(null);
        resetForm();
        setModalOpen(true);
    };

    const openEdit = (prod) => {
        setEditing(prod);
        setForm({
            nome: prod.nome,
            codigo: prod.codigo || '',
            descricao: prod.descricao || '',
            precoVenda: prod.precoVenda,
            quantidadeEstoque: prod.quantidadeEstoque,
            motivoAjuste: '',
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
        const novoSaldo = parseInt(form.quantidadeEstoque) || 0;
        const estoqueAlterado = editing && novoSaldo !== editing.quantidadeEstoque;
        if (estoqueAlterado && !form.motivoAjuste.trim()) {
            toast.error('Informe o motivo do ajuste de estoque');
            return;
        }
        setSaving(true);
        const payload = {
            nome: form.nome,
            codigo: form.codigo,
            descricao: form.descricao,
            precoVenda: parseFloat(form.precoVenda),
            categoriaId: parseInt(form.categoriaId),
        };
        try {
            if (editing) {
                await produtoService.update(editing.id, payload);
                if (estoqueAlterado) {
                    await produtoService.adjustStock(editing.id, {
                        novoSaldo,
                        motivo: form.motivoAjuste.trim(),
                    });
                }
                toast.success('Produto atualizado');
            } else {
                await produtoService.create({ ...payload, quantidadeEstoque: novoSaldo });
                toast.success('Produto criado');
            }
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['produtos'] });
            queryClient.invalidateQueries({ queryKey: ['produtos-all'] });
            queryClient.invalidateQueries({ queryKey: ['produtos-valor-total'] });
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
            queryClient.invalidateQueries({ queryKey: ['produtos-all'] });
            queryClient.invalidateQueries({ queryKey: ['produtos-valor-total'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao excluir');
        } finally {
            setConfirmDelete({ isOpen: false, produto: null });
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const estoqueAlterado = editing && (parseInt(form.quantidadeEstoque) || 0) !== editing.quantidadeEstoque;
    const formValid = form.nome.trim() && Number(form.precoVenda) > 0 && form.categoriaId
        && form.quantidadeEstoque !== '' && Number(form.quantidadeEstoque) >= 0
        && (!estoqueAlterado || form.motivoAjuste.trim());

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'codigo', header: 'Código' },
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
                <span className={row.quantidadeEstoque <= 5 ? 'stock-quantity low' : 'stock-quantity'}>
                    {row.quantidadeEstoque}
                </span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Produtos"
                description="Gerencie o catálogo e acompanhe os níveis de estoque"
                breadcrumbs={[{ label: 'Cadastros' }, { label: 'Produtos' }]}
                actions={<button className="btn btn-primary" onClick={openNew}><LuPlus /> Novo produto</button>}
            />

            {/* Card do Valor Total do Estoque */}
            {valorTotalEstoque != null && (
                <div className="inventory-value-card">
                    <span className="inventory-value-icon"><LuGem /></span>
                    <div>
                        <div className="inventory-value-label">
                            Valor Total em Estoque
                        </div>
                        <div className="inventory-value-total">
                            {formatCurrency(valorTotalEstoque)}
                        </div>
                    </div>
                </div>
            )}

            {(categoriaId || estoqueMax != null || initialProductSearch) && (
                <div className="active-filter" role="status">
                    <span>
                        {categoriaId && <>Categoria: <strong>{categoriaNome || `#${categoriaId}`}</strong></>}
                        {estoqueMax != null && <><LuTriangleAlert /> <strong>Estoque baixo</strong></>}
                        {initialProductSearch && <>Produto: <strong>{initialProductSearch}</strong></>}
                    </span>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                            setSearchParams({});
                            setPage(0);
                        }}
                    >
                        Limpar filtro
                    </button>
                </div>
            )}

            <DataTable
                key={`${initialProductSearch}-${estoqueMax ?? 'all'}-${categoriaId ?? 'all'}`}
                columns={columns}
                data={produtos}
                loading={loadingProdutos || loadingCategorias}
                searchPlaceholder="Procurar produto..."
                onEdit={openEdit}
                onDelete={handleDeleteClick}
                pagination={pagination}
                onPageChange={setPage}
                onSearchChange={(value) => { setSearch(value); setPage(0); }}
                initialSearch={initialProductSearch}
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Produto' : 'Novo Produto'}
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
                        placeholder="Nome do produto"
                        autoFocus
                    />
                    {!form.nome.trim() && <span className="form-error">Informe o nome do produto.</span>}
                </div>
                <div className="form-group">
                    <label>Código</label>
                    <input
                        type="text"
                        name="codigo"
                        value={form.codigo}
                        onChange={handleChange}
                        placeholder="Código / SKU"
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

                <div className="form-grid form-grid-2">
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
                {editing && parseInt(form.quantidadeEstoque || '0') !== editing.quantidadeEstoque && (
                    <div className="form-group">
                        <label>Motivo do ajuste de estoque *</label>
                        <input
                            type="text"
                            name="motivoAjuste"
                            value={form.motivoAjuste}
                            onChange={handleChange}
                            maxLength={255}
                            placeholder="Ex.: contagem física, perda ou entrada manual"
                        />
                        {!form.motivoAjuste.trim() && <span className="form-error">Explique o motivo para manter o histórico do estoque.</span>}
                    </div>
                )}
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
