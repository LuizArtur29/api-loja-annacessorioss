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
    LuUserRound,
} from 'react-icons/lu';
import authService from '../../api/authService';

function Sidebar({ isOpen, onClose }) {
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
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">AC</div>
                <div className="sidebar-brand">
                    <h1>Ana Acessórios</h1>
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
                                onClick={onClose}
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
            <div className="sidebar-footer">
                {user && (
                    <div className="sidebar-user">
                        <span className="sidebar-user-avatar"><LuUserRound /></span>
                        <div>
                            <small>Conta conectada</small>
                            <strong>{user.username}</strong>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="sidebar-link sidebar-logout"
                >
                    <LuLogOut />
                    Sair
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
