// src/components/ClientModal.jsx  (cadastro / identificação do paciente)
import { LOCATIONS, PLANS, SEX_OPTIONS, calcAge } from "../utils/physioUtils";

export default function ClientModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  isEditing,
}) {
  if (!isOpen) return null;

  const age = calcAge(form.birthDate);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{isEditing ? "Editar Paciente" : "Cadastrar Paciente"}</h3>

        <form onSubmit={onSubmit}>
          <h4 className="form-section">Identificação</h4>

          <label className="field">
            <span>Nome do paciente</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              required
            />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Data de nascimento {age ? `(${age})` : ""}</span>
              <input
                type="date"
                name="birthDate"
                value={form.birthDate}
                onChange={onChange}
              />
            </label>

            <label className="field">
              <span>Sexo</span>
              <select name="sex" value={form.sex} onChange={onChange}>
                <option value="">Selecione</option>
                {SEX_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>CPF</span>
              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={onChange}
                placeholder="000.000.000-00"
              />
            </label>

            <label className="field">
              <span>RG</span>
              <input
                type="text"
                name="rg"
                value={form.rg}
                onChange={onChange}
              />
            </label>
          </div>

          <label className="field">
            <span>Endereço</span>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={onChange}
            />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Telefone celular / WhatsApp</span>
              <input
                type="tel"
                name="phone"
                placeholder="ex: 5516999999999"
                value={form.phone}
                onChange={onChange}
                required
              />
            </label>

            <label className="field">
              <span>Telefone fixo</span>
              <input
                type="tel"
                name="phoneLandline"
                value={form.phoneLandline}
                onChange={onChange}
              />
            </label>
          </div>

          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
            />
          </label>

          <h4 className="form-section">Atendimento (padrão)</h4>

          <div className="form-row">
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
              <span>Local de atendimento</span>
              <select
                name="defaultLocation"
                value={form.defaultLocation}
                onChange={onChange}
              >
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Valor da sessão (R$)</span>
              <input
                type="number"
                name="defaultSessionValue"
                min="0"
                step="0.01"
                value={form.defaultSessionValue}
                onChange={onChange}
              />
            </label>
          </div>

          <label className="field">
            <span>Observações gerais (aparecem na agenda)</span>
            <textarea
              name="comment"
              placeholder="Ex: prefere horários da manhã, alergia a pomadas..."
              value={form.comment}
              onChange={onChange}
              rows={3}
            />
          </label>

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