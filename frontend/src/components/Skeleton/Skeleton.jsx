import './Skeleton.css';

export function TableSkeleton({ rows = 6, columns = 5 }) {
    return (
        <div className={`skeleton-table columns-${Math.min(Math.max(columns, 1), 6)}`} aria-label="Carregando registros" aria-busy="true">
            {Array.from({ length: rows }, (_, row) => (
                <div className="skeleton-table-row" key={row}>
                    {Array.from({ length: columns }, (_, column) => (
                        <span className="skeleton-block" key={column} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="page-skeleton" aria-label="Carregando página" aria-busy="true">
            <span className="skeleton-block skeleton-title" />
            <span className="skeleton-block skeleton-subtitle" />
            <div className="skeleton-card-grid">
                {Array.from({ length: 3 }, (_, index) => <span className="skeleton-block skeleton-card" key={index} />)}
            </div>
            <span className="skeleton-block skeleton-panel" />
        </div>
    );
}
