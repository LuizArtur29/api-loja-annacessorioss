import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuUser, LuLock, LuEye, LuEyeOff, LuGem } from 'react-icons/lu';
import authService from '../../api/authService';
import './Login.css';

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !senha.trim()) {
            setError('Preencha todos os campos');
            return;
        }

        setLoading(true);
        try {
            await authService.login(username.trim(), senha);
            navigate('/', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || 'Erro ao autenticar';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <LuGem />
                    </div>
                    <h1>Ana Acessórios</h1>
                    <p>Acesse o painel de gestão</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="login-error">{error}</div>}

                    <div className="login-field">
                        <label htmlFor="login-username">Usuário</label>
                        <div className="login-input-wrapper">
                            <input
                                type="text"
                                id="login-username"
                                placeholder="Digite seu usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                                autoComplete="username"
                            />
                            <LuUser />
                        </div>
                    </div>

                    <div className="login-field">
                        <label htmlFor="login-password">Senha</label>
                        <div className="login-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="login-password"
                                placeholder="Digite sua senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                autoComplete="current-password"
                            />
                            <LuLock />
                            <button
                                type="button"
                                className="login-toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <span className="login-spinner" />
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2026 Ana Acessórios — Painel Administrativo</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
