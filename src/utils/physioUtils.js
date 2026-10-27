// src/utils/physioUtils.js

// Dados da profissional (aparecem no cabeçalho do prontuário impresso)
export const PROFESSIONAL = {
  name: "Dra. Jéssyca Cássia de Freitas dos Santos da Silva",
  crefito: "CREFITO - 3 395585 F",
};

export const PLANS = ["Particular", "Convênio"];
export const LOCATIONS = ["Clínica", "Studio", "Domiciliar"];
export const SEX_OPTIONS = ["Feminino", "Masculino"];
export const EVA_OPTIONS = [
  "0 - Ausência",
  "1 a 3 - Leve",
  "4 a 7 - Moderada",
  "8 a 10 - Intensa",
];

export const RECORD_TYPES = { CONSULTA: "Consulta", RETORNO: "Retorno" };

export const APPOINTMENT_STATUS = {
  agendado: "Agendado",
  realizado: "Realizado",
  faltou: "Faltou",
  cancelado: "Cancelado",
};

export const DURATIONS = [30, 40, 50, 60, 90];
export const DEFAULT_DURATION = 50;

// Campos clínicos exibidos no prontuário (chave, rótulo)
export const CLINICAL_FIELDS = [
  ["ongoingTreatment", "Tratamento em andamento"],
  ["medicalReferral", "Encaminhamento médico"],
  ["diseaseHistory", "Histórico de doença"],
  ["surgeriesTraumas", "Cirurgias / traumas anteriores"],
  ["medications", "Medicamentos em uso"],
  ["mainComplaint", "Queixa principal"],
  ["diagnosis", "Diagnóstico / tratamento"],
  ["notes", "Observação"],
];

const pad = (n) => String(n).padStart(2, "0");

// Ignora maiúsculas/minúsculas e acentos na busca
export const normalizeText = (text) =>
  (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateBR(iso) {
  if (!iso || typeof iso !== "string" || !iso.includes("-")) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatBRL(value) {
  return (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Aceita "150", "150.5" e "150,50". Retorna null se vazio/inválido.
export function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Idade a partir de "AAAA-MM-DD"
export function calcAge(birthIso) {
  if (!birthIso || typeof birthIso !== "string") return "";
  const [y, m, d] = birthIso.split("-").map(Number);
  if (!y || !m || !d) return "";

  const now = new Date();
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (now.getDate() < d) months -= 1;
  if (months < 0) return "";
  if (months < 24) return months === 1 ? "1 mês" : `${months} meses`;
  return `${Math.floor(months / 12)} anos`;
}

// Totais financeiros: sessões, cobrado, recebido e em aberto
export function summarizeFinance(records = [], payments = []) {
  const charged = records.reduce((s, r) => s + (Number(r.sessionValue) || 0), 0);
  const paid =
    records.reduce((s, r) => s + (Number(r.paidValue) || 0), 0) +
    payments.reduce((s, p) => s + (Number(p.value) || 0), 0);
  return { sessions: records.length, charged, paid, open: charged - paid };
}

// Saldo em aberto de cada atendimento (regime de competência): { [recordId]: valor }.
// O pendente fica no mês do atendimento, não importa quando foi pago.
// Pagamentos avulsos (e o que foi pago a mais numa sessão) quitam primeiro
// os atendimentos mais antigos do mesmo paciente.
export function openBySession(records = [], payments = []) {
  const credit = {};
  const addCredit = (id, v) => {
    if (v > 0) credit[id] = (credit[id] || 0) + v;
  };
  payments.forEach((p) => addCredit(p.patientId, Number(p.value) || 0));
  records.forEach((r) =>
    addCredit(
      r.patientId,
      (Number(r.paidValue) || 0) - (Number(r.sessionValue) || 0)
    )
  );

  const open = {};
  [...records]
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .forEach((r) => {
      let due = Math.max(
        (Number(r.sessionValue) || 0) - (Number(r.paidValue) || 0),
        0
      );
      const used = Math.min(due, credit[r.patientId] || 0);
      if (used > 0) {
        credit[r.patientId] -= used;
        due -= used;
      }
      open[r.id] = due;
    });
  return open;
}

// ===== Formulário de atendimento (consulta / retorno) =====

export const emptyRecordForm = {
  date: "",
  type: "CONSULTA",
  location: "Clínica",
  plan: "Particular",
  sessionValue: "",
  paidValue: "",
  paymentDate: "",
  ongoingTreatment: "",
  medicalReferral: "",
  diseaseHistory: "",
  surgeriesTraumas: "",
  medications: "",
  mainComplaint: "",
  diagnosis: "",
  pa: "",
  spo2: "",
  bpm: "",
  eva: "",
  notes: "",
};

// Documento do Firestore -> estado do formulário (tudo como texto)
export function recordToForm(record) {
  const form = { ...emptyRecordForm };
  Object.keys(emptyRecordForm).forEach((key) => {
    const v = record[key];
    if (v !== undefined && v !== null) form[key] = String(v);
  });
  return form;
}

// Estado do formulário -> documento do Firestore
export function buildRecordPayload(form) {
  const isFirst = form.type === "CONSULTA";
  const sessionValue = toNumber(form.sessionValue) ?? 0;
  const paidValue = toNumber(form.paidValue) ?? 0;

  return {
    date: form.date,
    type: form.type,
    location: form.location,
    plan: form.plan,
    sessionValue,
    paidValue,
    // Se recebeu mas não informou a data do pagamento, assume a data do atendimento
    paymentDate: form.paymentDate || (paidValue > 0 ? form.date : ""),

    // Campos exclusivos da 1ª consulta
    ongoingTreatment: isFirst ? form.ongoingTreatment.trim() : "",
    medicalReferral: isFirst ? form.medicalReferral.trim() : "",
    diseaseHistory: isFirst ? form.diseaseHistory.trim() : "",
    surgeriesTraumas: isFirst ? form.surgeriesTraumas.trim() : "",

    medications: form.medications.trim(),
    mainComplaint: form.mainComplaint.trim(),
    diagnosis: form.diagnosis.trim(),
    pa: form.pa.trim(),
    spo2: toNumber(form.spo2),
    bpm: toNumber(form.bpm),
    eva: form.eva,
    notes: form.notes.trim(),
  };
}

// ===== Formulário de agendamento =====

export const emptyAppointmentForm = {
  clientId: "",
  date: "",
  time: "",
  duration: String(DEFAULT_DURATION),
  location: "Clínica",
  plan: "Particular",
  sessionValue: "",
  status: "agendado",
  notes: "",
};

export function appointmentToForm(appointment) {
  return {
    clientId: appointment.clientId || "",
    date: appointment.date || "",
    time: appointment.time || "",
    duration: String(appointment.duration || DEFAULT_DURATION),
    location: appointment.location || "Clínica",
    plan: appointment.plan || "Particular",
    sessionValue:
      appointment.sessionValue !== undefined && appointment.sessionValue !== null
        ? String(appointment.sessionValue)
        : "",
    status: appointment.status || "agendado",
    notes: appointment.notes || "",
  };
}

export function buildAppointmentPayload(form) {
  return {
    clientId: form.clientId,
    date: form.date,
    time: form.time,
    duration: Number(form.duration) || DEFAULT_DURATION,
    location: form.location,
    plan: form.plan,
    sessionValue: toNumber(form.sessionValue),
    status: form.status || "agendado",
    notes: form.notes.trim(),
  };
}