import { useEffect } from 'react';
import './ConfirmModal.css';

function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    promptLabel,
    promptValue = '',
    onPromptChange,
    promptRequired = false,
    onConfirm,
    onClose,
}) {
    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKeyDown = (event) => event.key === 'Escape' && onClose();
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay">
            <div
                className="confirm-modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
            >
                <h3 id="confirm-modal-title">{title}</h3>
                <p>{message}</p>
                {promptLabel && (
                    <div className="form-group">
                        <label htmlFor="confirm-modal-prompt">{promptLabel}{promptRequired ? ' *' : ''}</label>
                        <textarea
                            id="confirm-modal-prompt"
                            value={promptValue}
                            maxLength={255}
                            onChange={(event) => onPromptChange?.(event.target.value)}
                            autoFocus
                        />
                    </div>
                )}
                <div className="confirm-modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={onConfirm}
                        disabled={promptRequired && !promptValue.trim()}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
