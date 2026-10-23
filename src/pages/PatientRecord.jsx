// src/pages/PatientRecord.jsx  (prontuário do paciente)
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  deleteField,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import RecordModal from "../components/RecordModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import {
  CLINICAL_FIELDS,
  PROFESSIONAL,
  RECORD_TYPES,
  buildRecordPayload,
  calcAge,
  emptyRecordForm,
  formatBRL,
  formatDateBR,
  recordToForm,
  summarizeFinance,
  todayISO,
  toNumber,
} from "../utils/physioUtils";

const emptyPaymentForm = { value: "", date: "", notes: "" };

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);

  const [recordForm, setRecordForm] = useState(emptyRecordForm);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [recordToDelete, setRecordToDelete] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    const snap = await getDoc(doc(db, "clients", id));
    if (!snap.exists()) {
      setPatient(null);
      setLoading(false);
      return;
    }
    setPatient({ id: snap.id, ...snap.data() });

    const [recSnap, paySnap] = await Promise.all([
      getDocs(query(collection(db, "records"), where("patientId", "==", id))),
      getDocs(query(collection(db, "payments"), where("patientId", "==", id))),
    ]);

    const byDateDesc = (a, b) => (b.date || "").localeCompare(a.date || "");

    setRecords(
      recSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byDateDesc)
    );
    setPayments(
      paySnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byDateDesc)
    );
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p>Carregando prontuário...</p>;

  if (!patient) {
    return (
      <div>
        <p>Paciente não encontrado.</p>
        <button className="btn-secondary" onClick={() => navigate("/clientes")}>
          Voltar para pacientes
        </button>
      </div>
    );
  }

  const totals = summarizeFinance(records, payments);
  const age = calcAge(patient.birthDate);

  // ===== Atendimentos =====

  const handleNewRecord = () => {
    setRecordForm({
      ...emptyRecordForm,
      type: records.length === 0 ? "CONSULTA" : "RETORNO",
      date: todayISO(),
      plan: patient.plan || "Particular",
      location: patient.defaultLocation || "Clínica",
      sessionValue:
        patient.defaultSessionValue !== undefined &&
        patient.defaultSessionValue !== null
          ? String(patient.defaultSessionValue)
          : "",
    });
    setEditingRecordId(null);
    setIsRecordModalOpen(true);
  };

  const handleEditRecord = (record) => {
    setRecordForm(recordToForm(record));
    setEditingRecordId(record.id);
    setIsRecordModalOpen(true);
  };

  const handleRecordChange = (e) => {
    setRecordForm({ ...recordForm, [e.target.name]: e.target.value });
  };

  const handleCloseRecordModal = () => {
    setIsRecordModalOpen(false);
    setRecordForm(emptyRecordForm);
    setEditingRecordId(null);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    const payload = buildRecordPayload(recordForm);

    if (editingRecordId) {
      await updateDoc(doc(db, "records", editingRecordId), payload);
    } else {
      await addDoc(collection(db, "records"), {
        ...payload,
        patientId: id,
        createdAt: new Date().toISOString(),
      });
    }

    handleCloseRecordModal();
    await load();
  };

  const handleConfirmDeleteRecord = async () => {
    if (recordToDelete) {
      await deleteDoc(doc(db, "records", recordToDelete.id));

      // Reabre o agendamento de origem (se ainda existir)
      if (recordToDelete.appointmentId) {
        try {
          await updateDoc(
            doc(db, "appointments", recordToDelete.appointmentId),
            { status: "agendado", recordId: deleteField() }
          );
        } catch (err) {
          // agendamento já foi excluído: nada a fazer
        }
      }
      await load();
    }
    setRecordToDelete(null);
  };

  // ===== Pagamentos avulsos =====

  const handleOpenPaymentModal = () => {
    setPaymentForm({ ...emptyPaymentForm, date: todayISO() });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const value = toNumber(paymentForm.value);
    if (!value || value <= 0) return;

    await addDoc(collection(db, "payments"), {
      patientId: id,
      value,
      date: paymentForm.date,
      notes: paymentForm.notes.trim(),
      createdAt: new Date().toISOString(),
    });

    setIsPaymentModalOpen(false);
    setPaymentForm(emptyPaymentForm);
    await load();
  };

  const handleConfirmDeletePayment = async () => {
    if (paymentToDelete) {
      await deleteDoc(doc(db, "payments", paymentToDelete.id));
      await load();
    }
    setPaymentToDelete(null);
  };

  return (
    <div className="printable">
      {/* Cabeçalho que aparece só na impressão */}
      <div className="print-only print-header">
        <strong>{PROFESSIONAL.name}</strong>
        <div>{PROFESSIONAL.crefito}</div>
        <h2>Prontuário e acompanhamento do paciente</h2>
      </div>

      <div className="page-actions no-print">
        <button className="btn-secondary" onClick={() => navigate("/clientes")}>
          ← Pacientes
        </button>
        <div className="page-actions-right">
          <button className="btn-secondary" onClick={() => window.print()}>
            Imprimir
          </button>
          <button className="btn-secondary" onClick={handleOpenPaymentModal}>
            Pagamento avulso
          </button>
          <button className="btn-primary" onClick={handleNewRecord}>
            + Novo atendimento
          </button>
        </div>
      </div>

      {/* Identificação */}
      <section className="record-patient">
        <h2>{patient.name}</h2>
        <div className="info-grid">
          <div>
            <b>Nascimento:</b> {formatDateBR(patient.birthDate) || "—"}
            {age ? ` (${age})` : ""}
          </div>
          <div>
            <b>Sexo:</b> {patient.sex || "—"}
          </div>
          <div>
            <b>CPF:</b> {patient.cpf || "—"}
          </div>
          <div>
            <b>RG:</b> {patient.rg || "—"}
          </div>
          <div>
            <b>Celular:</b> {patient.phone || "—"}
          </div>
          <div>
            <b>Fixo:</b> {patient.phoneLandline || "—"}
          </div>
          <div>
            <b>Plano:</b> {patient.plan || "—"}
          </div>
          <div>
            <b>E-mail:</b> {patient.email || "—"}
          </div>
          <div className="info-wide">
            <b>Endereço:</b> {patient.address || "—"}
          </div>
        </div>
      </section>

      {/* Resumo financeiro */}
      <div className="summary-cards">
        <div className="summary-card">
          <small>Sessões</small>
          <strong>{totals.sessions}</strong>
        </div>
        <div className="summary-card">
          <small>Valor das sessões</small>
          <strong>{formatBRL(totals.charged)}</strong>
        </div>
        <div className="summary-card">
          <small>Valor recebido</small>
          <strong>{formatBRL(totals.paid)}</strong>
        </div>
        <div
          className={`summary-card ${
            totals.open > 0 ? "summary-card-alert" : ""
          }`}
        >
          <small>{totals.open < 0 ? "Crédito" : "Em aberto"}</small>
          <strong>{formatBRL(Math.abs(totals.open))}</strong>
        </div>
      </div>

      {/* Linha do tempo de atendimentos */}
      <h3>Atendimentos</h3>
      {records.length === 0 && (
        <p className="clients-empty">Nenhum atendimento registrado ainda.</p>
      )}

      {records.map((record) => {
        const vitals = [
          record.eva && `EVA: ${record.eva}`,
          record.pa && `PA: ${record.pa}`,
          record.spo2 !== null &&
            record.spo2 !== undefined &&
            record.spo2 !== "" &&
            `SpO2: ${record.spo2}%`,
          record.bpm !== null &&
            record.bpm !== undefined &&
            record.bpm !== "" &&
            `BPM: ${record.bpm}`,
        ].filter(Boolean);

        const owed =
          (Number(record.sessionValue) || 0) - (Number(record.paidValue) || 0);

        return (
          <article key={record.id} className="record-card">
            <header className="record-card-header">
              <div>
                <strong>{formatDateBR(record.date)}</strong>
                <span
                  className={`badge ${
                    record.type === "CONSULTA" ? "badge-first" : "badge-return"
                  }`}
                >
                  {RECORD_TYPES[record.type] || record.type}
                </span>
                <span className="badge badge-neutral">
                  {[record.location, record.plan].filter(Boolean).join(" · ")}
                </span>
              </div>

              <div className="icon-actions no-print">
                <button
                  type="button"
                  className="icon-btn icon-btn-sm icon-btn-edit"
                  onClick={() => handleEditRecord(record)}
                  aria-label="Editar atendimento"
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm icon-btn-delete"
                  onClick={() => setRecordToDelete(record)}
                  aria-label="Excluir atendimento"
                  title="Excluir"
                >
                  ✕
                </button>
              </div>
            </header>

            <dl className="record-fields">
              {CLINICAL_FIELDS.map(([key, label]) =>
                record[key] ? (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{record[key]}</dd>
                  </div>
                ) : null
              )}
            </dl>

            {vitals.length > 0 && (
              <p className="record-vitals">{vitals.join("  ·  ")}</p>
            )}

            <p className="record-money">
              Sessão: {formatBRL(record.sessionValue)} · Pago:{" "}
              {formatBRL(record.paidValue)}
              {record.paymentDate
                ? ` (${formatDateBR(record.paymentDate)})`
                : ""}
              {owed > 0 && (
                <span className="badge badge-open">
                  Falta {formatBRL(owed)}
                </span>
              )}
            </p>
          </article>
        );
      })}

      {/* Pagamentos avulsos */}
      {payments.length > 0 && (
        <>
          <h3>Pagamentos avulsos</h3>
          <ul className="payments-list">
            {payments.map((p) => (
              <li key={p.id}>
                <span>
                  {formatDateBR(p.date)} — <b>{formatBRL(p.value)}</b>
                  {p.notes ? ` — ${p.notes}` : ""}
                </span>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm icon-btn-delete no-print"
                  onClick={() => setPaymentToDelete(p)}
                  aria-label="Excluir pagamento"
                  title="Excluir"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={handleCloseRecordModal}
        form={recordForm}
        onChange={handleRecordChange}
        onSubmit={handleRecordSubmit}
        isEditing={!!editingRecordId}
        patientName={patient.name}
      />

      {isPaymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-small">
            <h3>Pagamento avulso</h3>
            <form onSubmit={handlePaymentSubmit}>
              <label className="field">
                <span>Valor pago (R$)</span>
                <input
                  type="number"
                  name="value"
                  min="0.01"
                  step="0.01"
                  value={paymentForm.value}
                  onChange={handlePaymentChange}
                  required
                />
              </label>

              <label className="field">
                <span>Data do pagamento</span>
                <input
                  type="date"
                  name="date"
                  value={paymentForm.date}
                  onChange={handlePaymentChange}
                  required
                />
              </label>

              <label className="field">
                <span>Observação</span>
                <input
                  type="text"
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handlePaymentChange}
                />
              </label>

              <div className="modal-actions">
                <button type="submit">Salvar</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!recordToDelete}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDeleteRecord}
        message={`Excluir o atendimento de ${formatDateBR(
          recordToDelete?.date
        )}? Essa ação não pode ser desfeita.`}
      />

      <ConfirmDeleteModal
        isOpen={!!paymentToDelete}
        onCancel={() => setPaymentToDelete(null)}
        onConfirm={handleConfirmDeletePayment}
        message="Excluir este pagamento avulso?"
      />
    </div>
  );
}