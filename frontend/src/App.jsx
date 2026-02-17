import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Categorias from './pages/Categorias/Categorias';
import Produtos from './pages/Produtos/Produtos';
import Clientes from './pages/Clientes/Clientes';
import NovaVenda from './pages/NovaVenda/NovaVenda';
import Vendas from './pages/Vendas/Vendas';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1c1c27',
                        color: '#f0f0f5',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                    },
                }}
            />
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/categorias" element={<Categorias />} />
                    <Route path="/produtos" element={<Produtos />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/nova-venda" element={<NovaVenda />} />
                    <Route path="/vendas" element={<Vendas />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
