import './ConfirmModal.css';

function ConfirmModal({ isOpen, title, message, onConfirm, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-content">
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="confirm-modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        Sim, Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;