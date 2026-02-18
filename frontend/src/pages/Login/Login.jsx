import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuUser, LuLock, LuEye, LuEyeOff, LuGem } from 'react-icons/lu';
import authService from '../../api/authService';
import './Login.css';

function Login() {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
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

        if (isRegister && senha.length < 4) {
            setError('A senha deve ter no mínimo 4 caracteres');
            return;
        }

        setLoading(true);
        try {
            if (isRegister) {
                await authService.register(username.trim(), senha);
            } else {
                await authService.login(username.trim(), senha);
            }
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
                    <h1>Anna Cessórios</h1>
                    <p>{isRegister ? 'Crie sua conta para começar' : 'Acesse o painel de gestão'}</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="login-error">{error}</div>}

                    <div className="login-field">
                        <label>Usuário</label>
                        <div className="login-input-wrapper">
                            <input
                                type="text"
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
                        <label>Senha</label>
                        <div className="login-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Digite sua senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                autoComplete={isRegister ? 'new-password' : 'current-password'}
                            />
                            <LuLock />
                            <button
                                type="button"
                                className="login-toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <span className="login-spinner" />
                        ) : (
                            isRegister ? 'Criar Conta' : 'Entrar'
                        )}
                    </button>

                    <div className="login-toggle">
                        <p>
                            {isRegister ? 'Já tem uma conta? ' : 'Não tem conta? '}
                            <button
                                type="button"
                                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                            >
                                {isRegister ? 'Fazer login' : 'Criar conta'}
                            </button>
                        </p>
                    </div>
                </form>

                <div className="login-footer">
                    <p>© 2026 Anna Cessórios — Painel Administrativo</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
