// src/components/RecordModal.jsx  (ficha de consulta / retorno)
import {
  EVA_OPTIONS,
  LOCATIONS,
  PLANS,
  RECORD_TYPES,
} from "../utils/physioUtils";

export default function RecordModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  isEditing,
  patientName,
}) {
  if (!isOpen) return null;

  const isFirst = form.type === "CONSULTA";

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>
          {isEditing ? "Editar atendimento" : "Registrar atendimento"}
          {patientName ? ` — ${patientName}` : ""}
        </h3>

        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label className="field">
              <span>Tipo</span>
              <select name="type" value={form.type} onChange={onChange}>
                {Object.entries(RECORD_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Data do atendimento</span>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={onChange}
                required
              />
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
          </div>

          <h4 className="form-section">Financeiro</h4>
          <div className="form-row">
            <label className="field">
              <span>Valor da sessão (R$)</span>
              <input
                type="number"
                name="sessionValue"
                min="0"
                step="0.01"
                value={form.sessionValue}
                onChange={onChange}
              />
            </label>

            <label className="field">
              <span>Valor pago (R$)</span>
              <input
                type="number"
                name="paidValue"
                min="0"
                step="0.01"
                value={form.paidValue}
                onChange={onChange}
              />
            </label>

            <label className="field">
              <span>Data do pagamento</span>
              <input
                type="date"
                name="paymentDate"
                value={form.paymentDate}
                onChange={onChange}
              />
            </label>
          </div>

          <h4 className="form-section">Informações clínicas</h4>

          {isFirst && (
            <>
              <label className="field">
                <span>Tratamento em andamento</span>
                <textarea
                  name="ongoingTreatment"
                  rows={2}
                  value={form.ongoingTreatment}
                  onChange={onChange}
                />
              </label>

              <label className="field">
                <span>Encaminhamento médico</span>
                <textarea
                  name="medicalReferral"
                  rows={2}
                  value={form.medicalReferral}
                  onChange={onChange}
                />
              </label>

              <label className="field">
                <span>Histórico de doença</span>
                <textarea
                  name="diseaseHistory"
                  rows={2}
                  value={form.diseaseHistory}
                  onChange={onChange}
                />
              </label>

              <label className="field">
                <span>Cirurgias / traumas anteriores</span>
                <textarea
                  name="surgeriesTraumas"
                  rows={2}
                  value={form.surgeriesTraumas}
                  onChange={onChange}
                />
              </label>
            </>
          )}

          <label className="field">
            <span>Medicamentos em uso</span>
            <textarea
              name="medications"
              rows={2}
              value={form.medications}
              onChange={onChange}
            />
          </label>

          <label className="field">
            <span>Queixa principal</span>
            <textarea
              name="mainComplaint"
              rows={2}
              value={form.mainComplaint}
              onChange={onChange}
            />
          </label>

          <label className="field">
            <span>Diagnóstico / tratamento</span>
            <textarea
              name="diagnosis"
              rows={3}
              value={form.diagnosis}
              onChange={onChange}
            />
          </label>

          <h4 className="form-section">Sinais vitais e dor</h4>
          <div className="form-row">
            <label className="field">
              <span>PA (mmHg)</span>
              <input
                type="text"
                name="pa"
                placeholder="120/80"
                value={form.pa}
                onChange={onChange}
              />
            </label>

            <label className="field">
              <span>SpO2 (%)</span>
              <input
                type="number"
                name="spo2"
                min="0"
                max="100"
                value={form.spo2}
                onChange={onChange}
              />
            </label>

            <label className="field">
              <span>BPM</span>
              <input
                type="number"
                name="bpm"
                min="0"
                value={form.bpm}
                onChange={onChange}
              />
            </label>
          </div>

          <label className="field">
            <span>EVA (Escala Visual Analógica — dor)</span>
            <select name="eva" value={form.eva} onChange={onChange}>
              <option value="">Não avaliada</option>
              {EVA_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Observação / evolução</span>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={onChange}
            />
          </label>

          <div className="modal-actions">
            <button type="submit">
              {isEditing ? "Salvar Alterações" : "Salvar atendimento"}
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