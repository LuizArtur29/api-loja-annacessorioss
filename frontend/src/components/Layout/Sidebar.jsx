import { NavLink, useNavigate } from 'react-router-dom';
import {
    LuLayoutDashboard,
    LuTags,
    LuPackage,
    LuUsers,
    LuShoppingCart,
    LuReceipt,
    LuWallet,
    LuLogOut,
} from 'react-icons/lu';
import authService from '../../api/authService';

function Sidebar() {
    const navigate = useNavigate();
    const user = authService.getUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login', { replace: true });
    };

    const navItems = [
        {
            section: 'Geral',
            items: [
                { to: '/', icon: <LuLayoutDashboard />, label: 'Dashboard' },
            ],
        },
        {
            section: 'Cadastros',
            items: [
                { to: '/categorias', icon: <LuTags />, label: 'Categorias' },
                { to: '/produtos', icon: <LuPackage />, label: 'Produtos' },
                { to: '/clientes', icon: <LuUsers />, label: 'Clientes' },
            ],
        },
        {
            section: 'Vendas',
            items: [
                { to: '/nova-venda', icon: <LuShoppingCart />, label: 'Nova Venda' },
                { to: '/vendas', icon: <LuReceipt />, label: 'Histórico' },
            ],
        },
        {
            section: 'Financeiro',
            items: [
                { to: '/despesas', icon: <LuWallet />, label: 'Despesas' },
            ],
        },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">AC</div>
                <div className="sidebar-brand">
                    <h1>AC Acessórios</h1>
                    <span>Sistema de Gestão</span>
                </div>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((group) => (
                    <div key={group.section}>
                        <div className="sidebar-section-title">{group.section}</div>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) =>
                                    `sidebar-link${isActive ? ' active' : ''}`
                                }
                            >
                                {item.icon}
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>
            <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {user && (
                    <span style={{
                        fontSize: '0.78rem', color: 'var(--text-secondary)',
                        fontFamily: 'Outfit, sans-serif', fontWeight: 500,
                    }}>
                        👤 {user.username}
                    </span>
                )}
                <button
                    onClick={handleLogout}
                    className="sidebar-link"
                    style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        width: '100%', textAlign: 'left', color: 'var(--danger-color)',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', borderRadius: '8px', fontSize: '0.88rem',
                        fontFamily: 'Outfit, sans-serif', fontWeight: 500,
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <LuLogOut />
                    Sair
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
