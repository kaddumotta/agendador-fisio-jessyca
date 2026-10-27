// src/components/ConfirmDeleteModal.jsx
export default function ConfirmDeleteModal({
  isOpen,
  onCancel,
  onConfirm,
  title = "Confirmar exclusão",
  message = "Tem certeza que deseja excluir este agendamento?",
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-small">
        <h3>{title}</h3>
        <p>{message}</p>

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