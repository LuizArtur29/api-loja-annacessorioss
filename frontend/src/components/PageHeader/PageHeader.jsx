import { Link } from 'react-router-dom';
import { LuChevronRight } from 'react-icons/lu';
import './PageHeader.css';

function PageHeader({ title, description, eyebrow, breadcrumbs = [], actions }) {
    return (
        <header className="page-heading">
            <div className="page-heading-copy">
                {breadcrumbs.length > 0 && (
                    <nav className="breadcrumbs" aria-label="Navegação estrutural">
                        <Link to="/">Início</Link>
                        {breadcrumbs.map((item, index) => (
                            <span key={item.label}>
                                <LuChevronRight aria-hidden="true" />
                                {item.to && index < breadcrumbs.length - 1
                                    ? <Link to={item.to}>{item.label}</Link>
                                    : <span aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>{item.label}</span>}
                            </span>
                        ))}
                    </nav>
                )}
                {eyebrow && <span className="page-heading-eyebrow">{eyebrow}</span>}
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
            {actions && <div className="page-heading-actions">{actions}</div>}
        </header>
    );
}

export default PageHeader;
