import { useEffect, useRef, useState } from 'react';
import { LuSearch, LuPlus, LuPen, LuTrash2, LuInbox, LuChevronLeft, LuChevronRight, LuEllipsis } from 'react-icons/lu';
import { TableSkeleton } from '../Skeleton/Skeleton';
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
                       onSearchChange,
                       onRowClick,
                       editLabel = 'Editar',
                       deleteLabel = 'Excluir',
                       initialSearch = '',
                       editIcon = <LuPen />,
                       deleteIcon = <LuTrash2 />,
                   }) {
    const [search, setSearch] = useState(initialSearch);
    const [openActions, setOpenActions] = useState(null);
    const onSearchChangeRef = useRef(onSearchChange);

    useEffect(() => {
        onSearchChangeRef.current = onSearchChange;
    }, [onSearchChange]);

    useEffect(() => {
        if (!onSearchChangeRef.current) return undefined;
        const timer = window.setTimeout(() => onSearchChangeRef.current(search), 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    const filtered = onSearchChange ? data : data.filter((row) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return columns.some((col) => {
            const val = col.accessor ? col.accessor(row) : row[col.key];
            return val != null && String(val).toLowerCase().includes(term);
        });
    });

    const renderCell = (column, row) => column.render
        ? column.render(row)
        : column.accessor
            ? column.accessor(row)
            : row[column.key];

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
                <TableSkeleton columns={Math.min(columns.length + 1, 6)} />
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
                        <tr
                            key={row.id || idx}
                            className={onRowClick ? 'clickable-row' : undefined}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            onKeyDown={onRowClick ? (event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    onRowClick(row);
                                }
                            } : undefined}
                            tabIndex={onRowClick ? 0 : undefined}
                        >
                            {columns.map((col) => (
                                <td key={col.key || col.header}>
                                    {renderCell(col, row)}
                                </td>
                            ))}
                            {(onEdit || onDelete) && (
                                <td
                                    onClick={(event) => event.stopPropagation()}
                                    onKeyDown={(event) => event.stopPropagation()}
                                >
                                    <div className="table-actions">
                                        {onEdit && (
                                            <button
                                                className="btn btn-ghost"
                                                onClick={() => onEdit(row)}
                                                title={editLabel}
                                                data-tooltip={editLabel}
                                                aria-label={`${editLabel} registro`}
                                            >
                                                {editIcon}
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => onDelete(row)}
                                                title={deleteLabel}
                                                data-tooltip={deleteLabel}
                                                aria-label={`${deleteLabel} registro`}
                                            >
                                                {deleteIcon}
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

            {!loading && filtered.length > 0 && (
                <div className="data-cards">
                    {filtered.map((row, index) => {
                        const rowKey = row.id || index;
                        return (
                            <article
                                className={`data-card${onRowClick ? ' clickable' : ''}`}
                                key={rowKey}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                onKeyDown={onRowClick ? (event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        onRowClick(row);
                                    }
                                } : undefined}
                                tabIndex={onRowClick ? 0 : undefined}
                                role={onRowClick ? 'button' : undefined}
                            >
                                <div className="data-card-content">
                                    {columns.filter((column) => !column.mobileHidden).map((column) => (
                                        <div className="data-card-field" key={column.key || column.header}>
                                            <span>{column.header}</span>
                                            <div>{renderCell(column, row)}</div>
                                        </div>
                                    ))}
                                </div>
                                {(onEdit || onDelete) && (
                                    <div className="data-card-actions" onClick={(event) => event.stopPropagation()}>
                                        <button
                                            className="btn btn-ghost data-card-menu"
                                            aria-label="Abrir ações"
                                            aria-expanded={openActions === rowKey}
                                            onClick={() => setOpenActions(openActions === rowKey ? null : rowKey)}
                                        ><LuEllipsis /></button>
                                        {openActions === rowKey && (
                                            <div className="data-card-action-menu">
                                                {onEdit && <button onClick={() => { onEdit(row); setOpenActions(null); }}>{editIcon} {editLabel}</button>}
                                                {onDelete && <button className="danger" onClick={() => { onDelete(row); setOpenActions(null); }}>{deleteIcon} {deleteLabel}</button>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
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
