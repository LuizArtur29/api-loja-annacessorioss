import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LuMenu } from 'react-icons/lu';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
