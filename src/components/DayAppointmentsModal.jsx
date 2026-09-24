// // src/components/DayAppointmentsModal.jsx
// function formatDateToBR(isoDate) {
//   const [year, month, day] = isoDate.split("-");
//   return `${day}/${month}/${year}`;
// }

// export default function DayAppointmentsModal({
//   isOpen,
//   onClose,
//   date,
//   appointments,
//   getClientName,
//   onEdit,
//   onDelete,
// }) {
//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <h3>Agendamentos do dia {date ? formatDateToBR(date) : ""}</h3>

//         {appointments.length === 0 && <p>Nenhum agendamento nesse dia.</p>}

//         <ul>
//           {appointments.map((appointment) => (
//             <li key={appointment.id}>
//               <span>
//                 {appointment.time} - {getClientName(appointment.clientId)}
//                 {appointment.notes ? ` - ${appointment.notes}` : ""}
//               </span>
//               <div className="icon-actions">
//                 <button
//                   className="icon-btn icon-btn-edit"
//                   onClick={() => onEdit(appointment)}
//                   aria-label="Editar agendamento"
//                   title="Editar"
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="18"
//                     height="18"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   >
//                     <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
//                   </svg>
//                 </button>

//                 <button
//                   className="icon-btn icon-btn-delete"
//                   onClick={() => onDelete(appointment)}
//                   aria-label="Excluir agendamento"
//                   title="Excluir"
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="18"
//                     height="18"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   >
//                     <line x1="18" y1="6" x2="6" y2="18" />
//                     <line x1="6" y1="6" x2="18" y2="18" />
//                   </svg>
//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>

//         <div className="modal-actions">
//           <button type="button" className="btn-secondary" onClick={onClose}>
//             Fechar
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// src/components/DayAppointmentsModal.jsx
import { useEffect, useRef } from "react";

const START_HOUR = 5;
const END_HOUR = 21; // última linha: 21:00 - 22:00
const HOUR_HEIGHT = 72; // px por hora
const EVENT_MINUTES = 40; // duração visual do bloco (altura = 48px)

const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i
);

const GRID_CSS = `
.modal-content.modal-day {
  max-width: 760px;
}

.day-modal-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.day-modal-header h3 {
  margin: 0;
}

.day-modal-header .btn-primary {
  margin-bottom: 0;
}

.day-grid-scroll {
  max-height: 55vh;
  min-height: 240px;
  flex-shrink: 0;
  overflow-y: auto;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: white;
}

.day-grid {
  --label-w: 56px;
  position: relative;
}

.day-grid-row {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #e5e5e5;
}

.day-grid-label {
  width: var(--label-w);
  flex-shrink: 0;
  box-sizing: border-box;
  font-size: 12px;
  color: #777;
  text-align: right;
  padding: 4px 8px 0 0;
  border-right: 1px solid #e5e5e5;
  background: #fafafa;
}

.day-grid-slots {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.day-grid-slot {
  flex: 1;
  cursor: pointer;
  position: relative;
}

.day-grid-slot:first-child {
  border-bottom: 1px dashed #eee;
}

.day-grid-slot:hover {
  background-color: #e8f8ef;
}

.day-grid-slot:hover::after {
  content: "+ Agendar " attr(data-time);
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #1e8449;
  pointer-events: none;
}

.day-grid-events {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--label-w);
  right: 0;
  pointer-events: none;
}

.day-event {
  position: absolute;
  pointer-events: auto;
  box-sizing: border-box;
  background-color: #d5f5e3;
  border-left: 4px solid #25d366;
  border-radius: 6px;
  padding: 4px 6px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.day-event-info {
  flex: 1;
  min-width: 0;
}

.day-event-title {
  font-size: 13px;
  font-weight: bold;
  color: #1e5e3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-event-notes {
  font-size: 11px;
  color: #3d6b52;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-event-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn.icon-btn-sm {
  width: 26px;
  height: 26px;
  min-width: 26px;
}

.day-out-of-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-content .day-out-of-grid li {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 600px) {
  .day-grid {
    --label-w: 44px;
  }

  .day-grid-label {
    font-size: 11px;
    padding-right: 4px;
  }

  .day-event {
    padding: 3px 4px;
    gap: 4px;
  }

  .day-event-title {
    font-size: 12px;
  }
}
`;

function formatDateToBR(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function toMinutes(time) {
  if (!time || !time.includes(":")) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// Distribui agendamentos que se sobrepõem em colunas lado a lado
function layoutEvents(items) {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin);
  const result = [];
  let cluster = [];
  let clusterEnd = -1;
  let colEnds = [];

  const flush = () => {
    const cols = Math.max(...cluster.map((e) => e.col)) + 1;
    cluster.forEach((e) => result.push({ ...e, cols }));
    cluster = [];
    colEnds = [];
    clusterEnd = -1;
  };

  sorted.forEach((item) => {
    if (cluster.length && item.startMin >= clusterEnd) {
      flush();
    }

    let col = colEnds.findIndex((end) => end <= item.startMin);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(0);
    }

    colEnds[col] = item.startMin + EVENT_MINUTES;
    clusterEnd = Math.max(clusterEnd, item.startMin + EVENT_MINUTES);
    cluster.push({ ...item, col });
  });

  if (cluster.length) flush();

  return result;
}

const CommentsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function EventActions({ appointment, onViewComments, onEdit, onDelete }) {
  return (
    <div className="day-event-actions">
      <button
        type="button"
        className="icon-btn icon-btn-sm icon-btn-comments"
        onClick={() => onViewComments(appointment)}
        aria-label="Ver observações do cliente"
        title="Observações do cliente"
      >
        <CommentsIcon />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn-sm icon-btn-edit"
        onClick={() => onEdit(appointment)}
        aria-label="Editar agendamento"
        title="Editar"
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn-sm icon-btn-delete"
        onClick={() => onDelete(appointment)}
        aria-label="Excluir agendamento"
        title="Excluir"
      >
        <DeleteIcon />
      </button>
    </div>
  );
}

export default function DayAppointmentsModal({
  isOpen,
  onClose,
  date,
  appointments,
  getClientName,
  onEdit,
  onDelete,
  onCreate,
  onViewComments,
}) {
  const scrollRef = useRef(null);

  // Separa o que cabe na grade do que fica fora do intervalo
  const gridStartMin = START_HOUR * 60;
  const gridEndMin = (END_HOUR + 1) * 60;

  const inGrid = [];
  const outOfGrid = [];

  appointments.forEach((a) => {
    const startMin = toMinutes(a.time);
    if (startMin === null || startMin < gridStartMin || startMin >= gridEndMin) {
      outOfGrid.push(a);
    } else {
      inGrid.push({ appointment: a, startMin });
    }
  });

  const positioned = layoutEvents(inGrid);

  // Ao abrir, rola até o primeiro agendamento (ou 07:00)
  useEffect(() => {
    if (!isOpen || !scrollRef.current) return;

    const firstMin = inGrid.length
      ? Math.min(...inGrid.map((e) => e.startMin))
      : 7 * 60;

    const top = Math.max(
      0,
      ((firstMin - gridStartMin) * HOUR_HEIGHT) / 60 - 30
    );
    scrollRef.current.scrollTop = top;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, date]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <style>{GRID_CSS}</style>

      <div className="modal-content modal-day">
        <div className="day-modal-header">
          <h3>Agendamentos do dia {date ? formatDateToBR(date) : ""}</h3>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onCreate("")}
          >
            + Novo agendamento
          </button>
        </div>

        <div className="day-grid-scroll" ref={scrollRef}>
          <div className="day-grid">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="day-grid-row"
                style={{ height: HOUR_HEIGHT }}
              >
                <div className="day-grid-label">{pad(hour)}:00</div>
                <div className="day-grid-slots">
                  <div
                    className="day-grid-slot"
                    data-time={`${pad(hour)}:00`}
                    onClick={() => onCreate(`${pad(hour)}:00`)}
                    title={`Agendar às ${pad(hour)}:00`}
                  />
                  <div
                    className="day-grid-slot"
                    data-time={`${pad(hour)}:30`}
                    onClick={() => onCreate(`${pad(hour)}:30`)}
                    title={`Agendar às ${pad(hour)}:30`}
                  />
                </div>
              </div>
            ))}

            <div className="day-grid-events">
              {positioned.map(({ appointment, startMin, col, cols }) => {
                const top = ((startMin - gridStartMin) * HOUR_HEIGHT) / 60;
                const height = (EVENT_MINUTES * HOUR_HEIGHT) / 60;
                const widthPct = 100 / cols;

                return (
                  <div
                    key={appointment.id}
                    className="day-event"
                    style={{
                      top,
                      height,
                      left: `${col * widthPct}%`,
                      width: `calc(${widthPct}% - 3px)`,
                    }}
                  >
                    <div className="day-event-info">
                      <div className="day-event-title">
                        {appointment.time} - {getClientName(appointment.clientId)}
                      </div>
                      {appointment.notes && (
                        <div className="day-event-notes">{appointment.notes}</div>
                      )}
                    </div>

                    <EventActions
                      appointment={appointment}
                      onViewComments={onViewComments}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {outOfGrid.length > 0 && (
          <div className="day-out-of-grid">
            <strong>Fora do horário da grade</strong>
            <ul>
              {outOfGrid.map((appointment) => (
                <li key={appointment.id}>
                  <span>
                    {appointment.time || "Sem horário"} -{" "}
                    {getClientName(appointment.clientId)}
                    {appointment.notes ? ` - ${appointment.notes}` : ""}
                  </span>
                  <EventActions
                    appointment={appointment}
                    onViewComments={onViewComments}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}