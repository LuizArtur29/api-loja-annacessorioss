import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LuCakeSlice, LuMenu } from 'react-icons/lu';
import Sidebar from './Sidebar';
import clienteService from '../../api/clienteService';
import './Layout.css';

const getLocalDateKey = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
};

function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { data: aniversariantes = [] } = useQuery({
        queryKey: ['clientes-aniversariantes', getLocalDateKey()],
        queryFn: async () => (await clienteService.getBirthdayCustomers(getLocalDateKey())).data,
        staleTime: 60 * 60 * 1000,
    });

    useEffect(() => {
        if (aniversariantes.length === 0) return;

        const hoje = getLocalDateKey();
        const notificationKey = `aniversarios-notificados-${hoje}`;
        let idsNotificados = [];
        try {
            const storedIds = JSON.parse(window.localStorage.getItem(notificationKey) || '[]');
            idsNotificados = Array.isArray(storedIds) ? storedIds : [];
        } catch {
            idsNotificados = [];
        }

        const novosAniversariantes = aniversariantes.filter(
            (cliente) => !idsNotificados.includes(cliente.id)
        );
        if (novosAniversariantes.length === 0) return;

        const nomes = novosAniversariantes.map((cliente) => cliente.nome).join(', ');
        toast.success(
            novosAniversariantes.length === 1
                ? `Hoje é aniversário de ${nomes}!`
                : `Aniversariantes de hoje: ${nomes}`,
            { duration: 10000, id: notificationKey, icon: <LuCakeSlice /> }
        );
        window.localStorage.setItem(
            notificationKey,
            JSON.stringify([...new Set([
                ...idsNotificados,
                ...novosAniversariantes.map((cliente) => cliente.id),
            ])])
        );
    }, [aniversariantes]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="layout">
            <button
                className="mobile-menu-toggle"
                onClick={toggleSidebar}
                aria-label="Menu"
            >
                <LuMenu />
            </button>

            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            <main className="layout-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
