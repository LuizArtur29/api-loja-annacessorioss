import { NavLink } from 'react-router-dom';
import {
    LuLayoutDashboard,
    LuTags,
    LuPackage,
    LuUsers,
    LuShoppingCart,
    LuReceipt,
    LuWallet,
} from 'react-icons/lu';

function Sidebar() {
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
                <div className="sidebar-logo">💎</div>
                <div className="sidebar-brand">
                    <h1>Bijuterias</h1>
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
        </aside>
    );
}

export default Sidebar;