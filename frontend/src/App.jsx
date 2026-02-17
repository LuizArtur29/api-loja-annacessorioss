import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Despesas from './pages/Despesas/Despesas';
import Categorias from './pages/Categorias/Categorias';
import Produtos from './pages/Produtos/Produtos';
import Clientes from './pages/Clientes/Clientes';
import NovaVenda from './pages/NovaVenda/NovaVenda';
import Vendas from './pages/Vendas/Vendas';
import './App.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
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
                        <Route path="/despesas" element={<Despesas />} />
                        <Route path="/categorias" element={<Categorias />} />
                        <Route path="/produtos" element={<Produtos />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/nova-venda" element={<NovaVenda />} />
                        <Route path="/vendas" element={<Vendas />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
