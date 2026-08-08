import { useEffect } from 'react';
import { LuLoaderCircle, LuX } from 'react-icons/lu';
import './Modal.css';

function Modal({ isOpen, onClose, title, children, onSubmit, submitLabel = 'Salvar', loading, submitDisabled = false }) {
    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKeyDown = (event) => event.key === 'Escape' && !loading && onClose();
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="modal-header">
                    <h3 id="modal-title">{title}</h3>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar modal">
                        <LuX />
                    </button>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit?.();
                    }}
                >
                    <div className="modal-body">{children}</div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || submitDisabled}>
                            {loading && <LuLoaderCircle className="button-spinner" />}
                            {loading ? 'Salvando...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Modal;
