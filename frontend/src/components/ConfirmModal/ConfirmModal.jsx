import './ConfirmModal.css';

function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirmar', onConfirm, onClose }) {
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
                <div className="confirm-modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
