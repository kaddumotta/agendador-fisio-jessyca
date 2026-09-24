// src/components/AppointmentModal.jsx
export default function AppointmentModal({
  isOpen,
  onClose,
  clients,
  form,
  onChange,
  onSubmit,
  isEditing,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{isEditing ? "Editar Agendamento" : "Realizar Agendamento"}</h3>

        <form onSubmit={onSubmit}>
          <select
            name="clientId"
            value={form.clientId}
            onChange={onChange}
            required
          >
            <option value="">Selecione o cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="date"
            value={form.date}
            onChange={onChange}
            required
          />

          <input
            type="time"
            name="time"
            value={form.time}
            onChange={onChange}
            required
          />

          <input
            type="text"
            name="notes"
            placeholder="Observações"
            value={form.notes}
            onChange={onChange}
          />

          <div className="modal-actions">
            <button type="submit">
              {isEditing ? "Salvar Alterações" : "Agendar"}
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