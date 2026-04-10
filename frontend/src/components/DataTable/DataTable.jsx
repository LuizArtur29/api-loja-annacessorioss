import { useState } from 'react';
import { LuSearch, LuPlus, LuPen, LuTrash2, LuInbox, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import './DataTable.css';

const getVisiblePages = (currentPage, totalPages) => {
    const total = totalPages || 1;
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i);
    }
    if (currentPage <= 2) {
        return [0, 1, 2, 3, 4];
    }
    if (currentPage >= total - 3) {
        return [total - 5, total - 4, total - 3, total - 2, total - 1];
    }
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
};

function DataTable({
                       columns,
                       data,
                       loading,
                       searchPlaceholder = 'Buscar...',
                       onAdd,
                       addLabel = 'Novo',
                       onEdit,
                       onDelete,
                       // Pagination props
                       pagination,
                       onPageChange,
                   }) {
    const [search, setSearch] = useState('');

    const filtered = data.filter((row) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return columns.some((col) => {
            const val = col.accessor ? col.accessor(row) : row[col.key];
            return val != null && String(val).toLowerCase().includes(term);
        });
    });

    return (
        <div className="data-table-wrapper">
            <div className="data-table-toolbar">
                <div className="data-table-search">
                    <LuSearch />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {onAdd && (
                    <button className="btn btn-primary" onClick={onAdd}>
                        <LuPlus /> {addLabel}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="data-table-loading">
                    <div className="spinner" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="data-table-empty">
                    <LuInbox />
                    <p>{search ? 'Nenhum resultado encontrado' : 'Nenhum registro cadastrado'}</p>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key || col.header}>{col.header}</th>
                        ))}
                        {(onEdit || onDelete) && <th>Ações</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((row, idx) => (
                        <tr key={row.id || idx}>
                            {columns.map((col) => (
                                <td key={col.key || col.header}>
                                    {col.render
                                        ? col.render(row)
                                        : col.accessor
                                            ? col.accessor(row)
                                            : row[col.key]}
                                </td>
                            ))}
                            {(onEdit || onDelete) && (
                                <td>
                                    <div className="table-actions">
                                        {onEdit && (
                                            <button
                                                className="btn btn-ghost"
                                                onClick={() => onEdit(row)}
                                                title="Editar"
                                            >
                                                <LuPen />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => onDelete(row)}
                                                title="Excluir"
                                            >
                                                <LuTrash2 />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {pagination && !loading && (
                <div className="data-table-pagination">
                    <span className="pagination-info">
                        Página {pagination.number + 1} de {pagination.totalPages || 1}
                        {' · '}
                        {pagination.totalElements} registro{pagination.totalElements !== 1 ? 's' : ''}
                    </span>
                    <div className="pagination-controls">
                        <button
                            className="btn btn-ghost"
                            disabled={pagination.first}
                            onClick={() => onPageChange(pagination.number - 1)}
                            title="Página anterior"
                        >
                            <LuChevronLeft />
                        </button>

                        {/* Correção feita aqui: pagination.totalPages com 's' */}
                        {getVisiblePages(pagination.number, pagination.totalPages).map((pageNum) => (
                            <button
                                key={pageNum}
                                className={`btn btn-ghost page-number ${pageNum === pagination.number ? 'active' : ''}`}
                                onClick={() => onPageChange(pageNum)}
                            >
                                {pageNum + 1}
                            </button>
                        ))}

                        <button
                            className="btn btn-ghost"
                            disabled={pagination.last}
                            onClick={() => onPageChange(pagination.number + 1)}
                            title="Próxima página"
                        >
                            <LuChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;