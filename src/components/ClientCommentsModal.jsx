// src/components/ClientCommentsModal.jsx
export default function ClientCommentsModal({ isOpen, onClose, client }) {
  if (!isOpen || !client) return null;

  const comments = client.comments || [];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Comentários de {client.name}</h3>

        {comments.length === 0 && <p>Nenhum comentário registrado.</p>}

        <ul>
          {comments.map((comment, index) => (
            <li key={index}>
              <span>{comment}</span>
            </li>
          ))}
        </ul>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}