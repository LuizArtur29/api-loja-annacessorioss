import { useState } from 'react';
import { LuSearch, LuPlus, LuPen, LuTrash2, LuInbox } from 'react-icons/lu';
import './DataTable.css';

function DataTable({
    columns,
    data,
    loading,
    searchPlaceholder = 'Buscar...',
    onAdd,
    addLabel = 'Novo',
    onEdit,
    onDelete,
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
        </div>
    );
}

export default DataTable;
