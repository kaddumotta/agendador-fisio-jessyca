// src/components/ClientModal.jsx
export default function ClientModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  isEditing,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{isEditing ? "Editar Cliente" : "Criar Registro"}</h3>

        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Nome"
            value={form.name}
            onChange={onChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="E-mail"
            value={form.email}
            onChange={onChange}
          />

          <input
            type="tel"
            name="phone"
            placeholder="Telefone (ex: 5511999999999)"
            value={form.phone}
            onChange={onChange}
            required
          />

          <textarea
            name="comment"
            placeholder="Comentário (opcional)"
            value={form.comment}
            onChange={onChange}
            rows={3}
          />

          <div className="modal-actions">
            <button type="submit">
              {isEditing ? "Salvar Alterações" : "Cadastrar"}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}