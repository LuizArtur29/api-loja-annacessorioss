import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import Login from './pages/Login/Login';
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
                            background: '#FFFFFF',
                            color: '#2C2418',
                            border: '1px solid #E8E0D4',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontFamily: "'Outfit', sans-serif",
                            boxShadow: '0 4px 12px rgba(44, 36, 24, 0.08)',
                        },
                    }}
                />
                <ErrorBoundary>
                    <Routes>
                        {/* Rota pública */}
                        <Route path="/login" element={<Login />} />

                        {/* Rotas protegidas */}
                        <Route element={
                            <PrivateRoute>
                                <Layout />
                            </PrivateRoute>
                        }>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/despesas" element={<Despesas />} />
                            <Route path="/categorias" element={<Categorias />} />
                            <Route path="/produtos" element={<Produtos />} />
                            <Route path="/clientes" element={<Clientes />} />
                            <Route path="/nova-venda" element={<NovaVenda />} />
                            <Route path="/vendas" element={<Vendas />} />
                        </Route>
                    </Routes>
                </ErrorBoundary>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
