import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-card">
                        <span className="error-boundary-icon">⚠️</span>
                        <h2>Algo deu errado</h2>
                        <p>Ocorreu um erro inesperado ao renderizar esta página.</p>
                        <p className="error-boundary-detail">
                            {this.state.error?.message || 'Erro desconhecido'}
                        </p>
                        <button className="btn btn-primary" onClick={this.handleReset}>
                            Tentar novamente
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
