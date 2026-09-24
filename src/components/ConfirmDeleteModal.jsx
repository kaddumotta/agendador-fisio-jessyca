// src/components/ConfirmDeleteModal.jsx
export default function ConfirmDeleteModal({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-small">
        <h3>Confirmar exclusão</h3>
        <p>Tem certeza que deseja excluir este agendamento?</p>

        <div className="modal-actions">
          <button className="btn-danger" onClick={onConfirm}>
            Excluir
          </button>
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}