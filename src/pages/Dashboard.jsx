// src/pages/Dashboard.jsx  (painel de atendimentos)
import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { monthNames } from "../utils/calendarUtils";
import {
  LOCATIONS,
  PROFESSIONAL,
  formatBRL,
  openBySession,
} from "../utils/physioUtils";
import "../dashboard.css";

// Paleta validada (roxo da marca + verde-água para "em aberto")
const COLORS = {
  main: "#6d28d9",
  soft: "#a78bfa",
  open: "#0d9488",
};

const money = (n) =>
  `R$ ${(Number(n) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const moneyShort = (n) =>
  `R$ ${Math.round(Number(n) || 0).toLocaleString("pt-BR")}`;

const monthShort = (key) => {
  const [y, m] = key.split("-");
  return `${monthNames[Number(m) - 1].slice(0, 3)}/${y.slice(2)}`;
};

const monthFull = (key) => {
  const [y, m] = key.split("-");
  return `${monthNames[Number(m) - 1]} ${y}`;
};

// ===== Gráfico de linhas (SVG) =====

function niceTicks(min, max, count = 4) {
  const raw = (max - min) / count || 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v);
  return { ticks, lo, hi };
}

function LineChart({ labels, series, format, title }) {
  const [hover, setHover] = useState(null);

  // O gráfico acompanha a largura disponível (texto sempre em tamanho real)
  const wrapRef = useRef(null);
  const [W, setW] = useState(640);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setW(Math.max(280, Math.round(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = Math.min(250, Math.max(180, Math.round(W * 0.26)));
  const small = W < 420;
  const pad = { t: 16, r: small ? 58 : 70, b: 32, l: small ? 60 : 58 };
  const n = labels.length;

  const all = series.flatMap((s) => s.values);
  const { ticks, lo, hi } = niceTicks(Math.min(0, ...all), Math.max(1, ...all));

  const x = (i) =>
    n === 1
      ? pad.l + (W - pad.l - pad.r) / 2
      : pad.l + (i * (W - pad.l - pad.r)) / (n - 1);
  const y = (v) => pad.t + ((hi - v) / (hi - lo)) * (H - pad.t - pad.b);

  // Rótulos diretos no último ponto, afastados para não se sobreporem
  const ends = series
    .map((s) => ({ s, y: y(s.values[n - 1]), v: s.values[n - 1] }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) {
    if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  }

  const colW = n > 1 ? (W - pad.l - pad.r) / (n - 1) : W - pad.l - pad.r;

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(t)}
              y2={y(t)}
              className={t === 0 ? "chart-zero" : "chart-grid"}
            />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">
              {format(t)}
            </text>
          </g>
        ))}

        {labels.map((l, i) => (
          <text
            key={l}
            x={x(i)}
            y={H - 10}
            textAnchor="middle"
            className="chart-axis"
          >
            {monthShort(l)}
          </text>
        ))}

        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={pad.t}
            y2={H - pad.b}
            className="chart-cross"
          />
        )}

        {series.map((s) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeDasharray={s.dash || undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r={hover === i ? 5 : 4}
                fill={s.color}
                className="chart-dot"
              />
            ))}
          </g>
        ))}

        {ends.map((e) => (
          <text
            key={e.s.name}
            x={W - pad.r + 8}
            y={e.y + 4}
            className="chart-end-label"
          >
            {format(e.v)}
          </text>
        ))}

        {/* Áreas de hover (maiores que os pontos) */}
        {labels.map((l, i) => (
          <rect
            key={l}
            x={x(i) - colW / 2}
            y={pad.t}
            width={colW}
            height={H - pad.t - pad.b}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onTouchStart={() => setHover(i)}
          />
        ))}
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(x(hover) / W) * 100}%`,
          }}
        >
          <strong>{monthFull(labels[hover])}</strong>
          {series.map((s) => (
            <div key={s.name}>
              <i style={{ background: s.color }} />
              {s.name}: <b>{format(s.values[hover])}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, labels, series, format, tableFormat }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <h3>{title}</h3>
        <button
          type="button"
          className="btn-secondary dash-small-btn"
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? "Ver gráfico" : "Ver tabela"}
        </button>
      </div>

      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.name}>
              <svg width="26" height="8" aria-hidden="true">
                <line
                  x1="0"
                  x2="26"
                  y1="4"
                  y2="4"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeDasharray={s.dash || undefined}
                />
              </svg>
              {s.name}
            </span>
          ))}
        </div>
      )}

      {labels.length === 0 ? (
        <p className="clients-empty">Sem dados no período.</p>
      ) : showTable ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mês</th>
                {series.map((s) => (
                  <th key={s.name} className="num">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((l, i) => (
                <tr key={l}>
                  <td>{monthFull(l)}</td>
                  {series.map((s) => (
                    <td key={s.name} className="num">
                      {(tableFormat || format)(s.values[i])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <LineChart
          labels={labels}
          series={series}
          format={format}
          title={title}
        />
      )}
    </section>
  );
}

// ===== Ícones (SVG, traço branco) =====

const Svg = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Icon = {
  Clipboard: () => (
    <Svg>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M8.5 14l2.5 2.5 4.5-5.5" />
    </Svg>
  ),
  Stethoscope: () => (
    <Svg>
      <path d="M6 3v6a4 4 0 0 0 8 0V3" />
      <path d="M10 13v2a4.5 4.5 0 0 0 9 0v-1.5" />
      <circle cx="19" cy="11.5" r="2" />
    </Svg>
  ),
  Return: () => (
    <Svg>
      <path d="M20 11a8 8 0 0 0-14-4.5L4 9" />
      <path d="M4 4v5h5" />
      <path d="M4 13a8 8 0 0 0 14 4.5L20 15" />
      <path d="M20 20v-5h-5" />
    </Svg>
  ),
  Shield: () => (
    <Svg>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M12 8v6M9 11h6" />
    </Svg>
  ),
  Female: () => (
    <Svg>
      <circle cx="12" cy="8" r="4.5" />
      <path d="M12 12.5V21M8.5 17.5h7" />
    </Svg>
  ),
  Male: () => (
    <Svg>
      <circle cx="10" cy="14" r="4.5" />
      <path d="M13.5 10.5L20 4M15 4h5v5" />
    </Svg>
  ),
  Home: () => (
    <Svg>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </Svg>
  ),
  Studio: () => (
    <Svg>
      <path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" />
    </Svg>
  ),
  Clinic: () => (
    <Svg>
      <rect x="4" y="4" width="16" height="17" rx="1" />
      <path d="M12 8v6M9 11h6" />
      <path d="M10 21v-4h4v4" />
    </Svg>
  ),
  Money: () => (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.2c-.6-.8-1.6-1.2-2.6-1.2-1.5 0-2.6.8-2.6 2s1 1.7 2.7 2.1c1.7.4 2.7.9 2.7 2.1s-1.1 2-2.7 2c-1.1 0-2.1-.5-2.7-1.3" />
      <path d="M12 6.5V8m0 8v1.5" />
    </Svg>
  ),
};

const LOCATION_ICONS = {
  Clínica: <Icon.Clinic />,
  Studio: <Icon.Studio />,
  Domiciliar: <Icon.Home />,
};

// ===== Cartões =====

function Stat({ value, label, big, icon }) {
  return (
    <div className={`dash-stat ${big ? "dash-stat-big" : ""}`}>
      {icon && <div className="dash-stat-icon">{icon}</div>}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Tile({ children, className = "", icon }) {
  return (
    <div className={`dash-tile ${className}`}>
      {icon && <div className="dash-tile-icon">{icon}</div>}
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState("");
  const [location, setLocation] = useState("");

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

  const years = useMemo(() => {
    const set = new Set([String(new Date().getFullYear())]);
    records.forEach((r) => r.date && set.add(r.date.slice(0, 4)));
    payments.forEach((p) => p.date && set.add(p.date.slice(0, 4)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [records, payments]);

  const data = useMemo(() => {
    const matchYear = (d) => !year || (d && d.slice(0, 4) === year);
    const matchMonth = (d) => !month || (d && d.slice(5, 7) === month);
    const matchLoc = (r) => !location || r.location === location;
    const payDate = (r) =>
      (Number(r.paidValue) || 0) > 0 ? r.paymentDate || r.date : "";

    // Cobrado e em aberto: pela data do atendimento (competência).
    // Recebido: pela data do pagamento (caixa).
    // O em aberto considera todos os pagamentos já feitos, inclusive os de meses seguintes.
    const openMap = openBySession(records, payments);
    const sumOpen = (list) => list.reduce((s, r) => s + (openMap[r.id] || 0), 0);

    // Cartões: ano + mês + local
    const cardRecords = records.filter(
      (r) => matchYear(r.date) && matchMonth(r.date) && matchLoc(r)
    );
    const cardPaidRecords = records.filter(
      (r) => matchYear(payDate(r)) && matchMonth(payDate(r)) && matchLoc(r)
    );
    // Avulsos não têm local: só entram quando não há filtro de local
    const cardPayments = location
      ? []
      : payments.filter((p) => matchYear(p.date) && matchMonth(p.date));

    const charged = cardRecords.reduce(
      (s, r) => s + (Number(r.sessionValue) || 0),
      0
    );
    const received =
      cardPaidRecords.reduce((s, r) => s + (Number(r.paidValue) || 0), 0) +
      cardPayments.reduce((s, p) => s + (Number(p.value) || 0), 0);

    const count = (fn) => cardRecords.filter(fn).length;

    // Pacientes distintos por sexo
    const sexOf = (id) => clients.find((c) => c.id === id)?.sex;
    const patientIds = [...new Set(cardRecords.map((r) => r.patientId))];

    // Gráficos mensais: ano + local (mostram todos os meses)
    const chartRecords = records.filter((r) => matchYear(r.date) && matchLoc(r));
    const chartPaidRecords = records.filter(
      (r) => matchYear(payDate(r)) && matchLoc(r)
    );
    const chartPayments = location
      ? []
      : payments.filter((p) => matchYear(p.date));

    const byMonth = {};
    const bucket = (key) =>
      (byMonth[key] ||= { sessions: 0, charged: 0, received: 0, open: 0 });

    chartRecords.forEach((r) => {
      const b = bucket(r.date.slice(0, 7));
      b.sessions += 1;
      b.charged += Number(r.sessionValue) || 0;
      b.open += openMap[r.id] || 0;
    });
    chartPaidRecords.forEach((r) => {
      bucket(payDate(r).slice(0, 7)).received += Number(r.paidValue) || 0;
    });
    chartPayments.forEach((p) => {
      bucket(p.date.slice(0, 7)).received += Number(p.value) || 0;
    });

    const labels = Object.keys(byMonth).sort();

    return {
      total: cardRecords.length,
      consultas: count((r) => r.type === "CONSULTA"),
      retornos: count((r) => r.type === "RETORNO"),
      particular: count((r) => r.plan === "Particular"),
      convenio: count((r) => r.plan === "Convênio"),
      feminino: patientIds.filter((id) => sexOf(id) === "Feminino").length,
      masculino: patientIds.filter((id) => sexOf(id) === "Masculino").length,
      byLocation: LOCATIONS.map((l) => ({
        label: l,
        value: count((r) => r.location === l),
      })),
      charged,
      received,
      open: sumOpen(cardRecords),
      labels,
      sessionsSeries: labels.map((k) => byMonth[k].sessions),
      chargedSeries: labels.map((k) => byMonth[k].charged),
      receivedSeries: labels.map((k) => byMonth[k].received),
      openSeries: labels.map((k) => byMonth[k].open),
    };
  }, [clients, records, payments, year, month, location]);

  if (loading) return <p>Carregando painel...</p>;

  return (
    <div className="dash">
      <header className="dash-title">
        <h2>ATENDIMENTOS FISIOTERAPIA</h2>
        <small>
          {PROFESSIONAL.name} · {PROFESSIONAL.crefito}
        </small>
      </header>

      <div className="filter-bar dash-filters">
        <label className="field">
          <span>Ano</span>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Todos</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Mês (cartões)</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">Todos</option>
            {monthNames.map((name, i) => (
              <option key={name} value={String(i + 1).padStart(2, "0")}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Tipo de atendimento</span>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Todos</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h3 className="dash-band">INFORMAÇÕES ACUMULADAS</h3>

      <div className="dash-grid">
        <Tile icon={<Icon.Clipboard />}>
          <Stat big value={data.total} label="Atendimentos" />
        </Tile>
        <Tile icon={<Icon.Stethoscope />}>
          <Stat big value={data.consultas} label="Consultas" />
        </Tile>
        <Tile icon={<Icon.Return />}>
          <Stat big value={data.retornos} label="Retornos" />
        </Tile>
        <Tile className="dash-split">
          <Stat icon={<Icon.Shield />} value={data.particular} label="Particular" />
          <Stat icon={<Icon.Shield />} value={data.convenio} label="Convênio" />
        </Tile>
        <Tile className="dash-split">
          <Stat icon={<Icon.Female />} value={data.feminino} label="Feminino" />
          <Stat icon={<Icon.Male />} value={data.masculino} label="Masculino" />
        </Tile>
      </div>

      <div className="dash-grid dash-grid-2">
        <Tile className="dash-split">
          {data.byLocation.map((l) => (
            <Stat
              key={l.label}
              icon={LOCATION_ICONS[l.label]}
              value={l.value}
              label={l.label}
            />
          ))}
        </Tile>
        <Tile className="dash-split" icon={<Icon.Money />}>
          <Stat value={money(data.charged)} label="Valor das sessões" />
          <Stat value={money(data.received)} label="Valor recebido" />
          <Stat value={money(data.open)} label="Em aberto" />
        </Tile>
      </div>

      <h3 className="dash-band">INFORMAÇÕES MENSAIS</h3>

      <div className="dash-charts">
      <ChartCard
        title="Atendimentos"
        labels={data.labels}
        series={[
          { name: "Atendimentos", color: COLORS.main, values: data.sessionsSeries },
        ]}
        format={(v) => String(Math.round(v))}
      />

      <ChartCard
        title="Valores mensais"
        labels={data.labels}
        series={[
          { name: "Valor cobrado", color: COLORS.main, values: data.chargedSeries },
          {
            name: "Valor recebido",
            color: COLORS.soft,
            dash: "6 4",
            values: data.receivedSeries,
          },
          {
            name: "Em aberto",
            color: COLORS.open,
            dash: "2 3",
            values: data.openSeries,
          },
        ]}
        format={moneyShort}
        tableFormat={formatBRL}
      />
      </div>
    </div>
  );
}