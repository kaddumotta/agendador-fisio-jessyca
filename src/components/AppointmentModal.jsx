// src/components/AppointmentModal.jsx
import {
  APPOINTMENT_STATUS,
  DURATIONS,
  LOCATIONS,
  PLANS,
} from "../utils/physioUtils";

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

  const sortedClients = [...clients].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "pt-BR")
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{isEditing ? "Editar Agendamento" : "Agendar Sessão"}</h3>

        <form onSubmit={onSubmit}>
          <label className="field">
            <span>Paciente</span>
            <select
              name="clientId"
              value={form.clientId}
              onChange={onChange}
              required
            >
              <option value="">Selecione o paciente</option>
              {sortedClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label className="field">
              <span>Data</span>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={onChange}
                required
              />
            </label>

            <label className="field">
              <span>Horário</span>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={onChange}
                required
              />
            </label>

            <label className="field">
              <span>Duração</span>
              <select
                name="duration"
                value={form.duration}
                onChange={onChange}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Local</span>
              <select name="location" value={form.location} onChange={onChange}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Plano</span>
              <select name="plan" value={form.plan} onChange={onChange}>
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Valor (R$)</span>
              <input
                type="number"
                name="sessionValue"
                min="0"
                step="0.01"
                value={form.sessionValue}
                onChange={onChange}
              />
            </label>
          </div>

          {isEditing && (
            <label className="field">
              <span>Situação</span>
              <select name="status" value={form.status} onChange={onChange}>
                {Object.entries(APPOINTMENT_STATUS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Observações</span>
            <input
              type="text"
              name="notes"
              placeholder="Ex: trazer exames"
              value={form.notes}
              onChange={onChange}
            />
          </label>

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