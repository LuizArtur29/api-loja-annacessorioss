import { LuFilter, LuX } from 'react-icons/lu';
import './FilterBar.css';

function FilterBar({ children, activeFilters = [], onClear }) {
    return (
        <section className="filter-bar" aria-label="Filtros">
            <div className="filter-bar-controls"><LuFilter aria-hidden="true" />{children}</div>
            {activeFilters.length > 0 && (
                <div className="filter-chips">
                    {activeFilters.map((filter) => <span className="filter-chip" key={filter}>{filter}</span>)}
                    <button type="button" className="filter-clear" onClick={onClear}><LuX /> Limpar filtros</button>
                </div>
            )}
        </section>
    );
}

export default FilterBar;
