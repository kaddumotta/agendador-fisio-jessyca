// src/pages/Finance.jsx  (pendências e resumo financeiro)
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { monthNames } from "../utils/calendarUtils";
import { formatBRL, openBySession } from "../utils/physioUtils";

const pad = (n) => String(n).padStart(2, "0");

const VIEW_OPTIONS = [
  { key: "paciente", label: "Por paciente" },
  { key: "mes", label: "Por mês" },
  { key: "plano", label: "Por plano" },
  { key: "local", label: "Por local" },
];
const ALL_VIEWS = VIEW_OPTIONS.map((v) => v.key);

function loadViews() {
  try {
    const saved = JSON.parse(localStorage.getItem("financeViews"));
    if (Array.isArray(saved)) return saved.filter((k) => ALL_VIEWS.includes(k));
  } catch (e) {
    // sem localStorage: usa o padrão
  }
  return ALL_VIEWS;
}

function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return {
    start: `${y}-${pad(m + 1)}-01`,
    end: `${y}-${pad(m + 1)}-${pad(last)}`,
  };
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return `${monthNames[Number(m) - 1]} ${y}`;
}

export default function Finance() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const initial = currentMonthRange();
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [views, setViews] = useState(loadViews);

  const has = (key) => views.includes(key);
  const allSelected = views.length === ALL_VIEWS.length;

  const updateViews = (next) => {
    setViews(next);
    try {
      localStorage.setItem("financeViews", JSON.stringify(next));
    } catch (e) {
      // ignora
    }
  };

  const toggleView = (key) =>
    updateViews(
      has(key) ? views.filter((k) => k !== key) : [...views, key]
    );

  useEffect(() => {
    const load = async () => {
      const [c, r, p] = await Promise.all([
        getDocs(collection(db, "clients")),
        getDocs(collection(db, "records")),
        getDocs(collection(db, "payments")),
      ]);
      setClients(c.docs.map((d) => ({ id: d.id, ...d.data() })));
      setRecords(r.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPayments(p.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  const inRange = (date) =>
    !!date &&
    (!startDate || date >= startDate) &&
    (!endDate || date <= endDate);

  const data = useMemo(() => {
    const payDate = (r) =>
      (Number(r.paidValue) || 0) > 0 ? r.paymentDate || r.date : "";

    // Cobrado e em aberto: atendimentos do período (competência).
    // Recebido: pagamentos feitos no período (caixa).
    // O em aberto considera todos os pagamentos já feitos, inclusive depois do período.
    const openMap = openBySession(records, payments);
    const fRecords = records.filter((r) => inRange(r.date));
    const fPaidRecords = records.filter((r) => inRange(payDate(r)));
    const fPayments = payments.filter((p) => inRange(p.date));

    const summarize = (list, paidList, paymentList) => ({
      sessions: list.length,
      charged: list.reduce((s, r) => s + (Number(r.sessionValue) || 0), 0),
      paid:
        paidList.reduce((s, r) => s + (Number(r.paidValue) || 0), 0) +
        paymentList.reduce((s, p) => s + (Number(p.value) || 0), 0),
      open: list.reduce((s, r) => s + (openMap[r.id] || 0), 0),
    });

    // Por paciente
    const byPatient = {};
    const group = (id) =>
      (byPatient[id] ||= { records: [], paidRecords: [], payments: [] });
    fRecords.forEach((r) => group(r.patientId).records.push(r));
    fPaidRecords.forEach((r) => group(r.patientId).paidRecords.push(r));
    fPayments.forEach((p) => group(p.patientId).payments.push(p));

    const patientRows = Object.entries(byPatient).map(([patientId, g]) => {
      const client = clients.find((c) => c.id === patientId);
      return {
        patientId,
        name: client ? client.name : "Paciente removido",
        ...summarize(g.records, g.paidRecords, g.payments),
      };
    });
    patientRows.sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));

    // Por mês (cobrado e em aberto pela data do atendimento, recebido pela data do pagamento)
    const byMonth = {};
    const month = (key) =>
      (byMonth[key] ||= { sessions: 0, charged: 0, received: 0, open: 0 });

    fRecords.forEach((r) => {
      const m = month(r.date.slice(0, 7));
      m.sessions += 1;
      m.charged += Number(r.sessionValue) || 0;
      m.open += openMap[r.id] || 0;
    });
    fPaidRecords.forEach((r) => {
      month(payDate(r).slice(0, 7)).received += Number(r.paidValue) || 0;
    });
    fPayments.forEach((p) => {
      month(p.date.slice(0, 7)).received += Number(p.value) || 0;
    });

    const monthRows = Object.entries(byMonth)
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.key.localeCompare(a.key));

    // Por plano e por local
    const groupBy = (field) => {
      const map = {};
      fRecords.forEach((r) => {
        const k = r[field] || "Não informado";
        map[k] ||= { label: k, sessions: 0, charged: 0 };
        map[k].sessions += 1;
        map[k].charged += Number(r.sessionValue) || 0;
      });
      return Object.values(map).sort((a, b) => b.sessions - a.sessions);
    };

    return {
      totals: summarize(fRecords, fPaidRecords, fPayments),
      consultas: fRecords.filter((r) => r.type === "CONSULTA").length,
      retornos: fRecords.filter((r) => r.type === "RETORNO").length,
      patientRows,
      monthRows,
      byPlan: groupBy("plan"),
      byLocation: groupBy("location"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, records, payments, startDate, endDate]);

  const visibleRows = onlyOpen
    ? data.patientRows.filter((r) => r.open > 0)
    : data.patientRows;

  if (loading) return <p>Carregando financeiro...</p>;

  return (
    <div>
      <h2>Financeiro</h2>

      <div className="filter-bar">
        <label className="field">
          <span>De</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const r = currentMonthRange();
            setStartDate(r.start);
            setEndDate(r.end);
          }}
        >
          Este mês
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
        >
          Todo o período
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <small>Atendimentos</small>
          <strong>{data.totals.sessions}</strong>
          <small>
            {data.consultas} consultas · {data.retornos} retornos
          </small>
        </div>
        <div className="summary-card">
          <small>Valor cobrado</small>
          <strong>{formatBRL(data.totals.charged)}</strong>
        </div>
        <div className="summary-card">
          <small>Valor recebido</small>
          <strong>{formatBRL(data.totals.paid)}</strong>
        </div>
        <div
          className={`summary-card ${
            data.totals.open > 0 ? "summary-card-alert" : ""
          }`}
        >
          <small>Em aberto</small>
          <strong>{formatBRL(data.totals.open)}</strong>
        </div>
      </div>

      <div className="chip-row" role="group" aria-label="Resumos exibidos">
        <button
          type="button"
          className={`chip ${allSelected ? "active" : ""}`}
          onClick={() => updateViews(allSelected ? [] : ALL_VIEWS)}
        >
          Todos
        </button>
        {VIEW_OPTIONS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={`chip ${has(v.key) ? "active" : ""}`}
            aria-pressed={has(v.key)}
            onClick={() => toggleView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {views.length === 0 && (
        <p className="clients-empty">Selecione ao menos um resumo acima.</p>
      )}

      {has("paciente") && (
      <>
      <div className="section-title">
        <h3>Por paciente</h3>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
          />
          Só com valor em aberto
        </label>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th className="num">Sessões</th>
              <th className="num">Cobrado</th>
              <th className="num">Recebido</th>
              <th className="num">Em aberto</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={5} className="clients-empty">
                  Nenhum lançamento no período.
                </td>
              </tr>
            )}
            {visibleRows.map((row) => (
              <tr
                key={row.patientId}
                className="clickable"
                onClick={() => navigate(`/clientes/${row.patientId}/prontuario`)}
              >
                <td>{row.name}</td>
                <td className="num">{row.sessions}</td>
                <td className="num">{formatBRL(row.charged)}</td>
                <td className="num">{formatBRL(row.paid)}</td>
                <td className={`num ${row.open > 0 ? "text-open" : ""}`}>
                  {formatBRL(row.open)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </>
      )}

      {has("mes") && (
      <>
      <h3>Por mês</h3>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th className="num">Atend.</th>
              <th className="num">Cobrado</th>
              <th className="num">Recebido</th>
              <th className="num">Em aberto</th>
            </tr>
          </thead>
          <tbody>
            {data.monthRows.map((row) => (
              <tr key={row.key}>
                <td>{monthLabel(row.key)}</td>
                <td className="num">{row.sessions}</td>
                <td className="num">{formatBRL(row.charged)}</td>
                <td className="num">{formatBRL(row.received)}</td>
                <td className={`num ${row.open > 0 ? "text-open" : ""}`}>
                  {formatBRL(row.open)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </>
      )}

      <div className={has("plano") && has("local") ? "two-cols" : ""}>
        {has("plano") && (
        <div>
          <h3>Por plano</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plano</th>
                <th className="num">Sessões</th>
                <th className="num">Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {data.byPlan.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{row.sessions}</td>
                  <td className="num">{formatBRL(row.charged)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {has("local") && (
        <div>
          <h3>Por local</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Local</th>
                <th className="num">Sessões</th>
                <th className="num">Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {data.byLocation.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{row.sessions}</td>
                  <td className="num">{formatBRL(row.charged)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}