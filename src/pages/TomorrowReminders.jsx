// src/pages/TomorrowReminders.jsx
import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { PROFESSIONAL } from "../utils/physioUtils";
import PageHeader from "../components/PageHeader";

function formatDateToBR(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

// Monta YYYY-MM-DD usando a data LOCAL (toISOString converte para UTC e erra à noite)
function toLocalISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// "Dra. Jéssyca" a partir do nome completo configurado em PROFESSIONAL
const professionalShortName = PROFESSIONAL.name.split(" ").slice(0, 2).join(" ");

export default function TomorrowReminders() {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = toLocalISODate(tomorrow);
  const dateStringBR = formatDateToBR(dateString);

  const fetchData = async () => {
    const clientsSnap = await getDocs(collection(db, "clients"));
    setClients(clientsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    const q = query(
      collection(db, "appointments"),
      where("date", "==", dateString)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      // Só quem ainda precisa de confirmação (agendamentos antigos não têm status)
      .filter((a) => !a.status || a.status === "agendado");
    list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    setAppointments(list);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getClient = (id) => {
    return clients.find((c) => c.id === id);
  };

  const buildWhatsAppLink = (client, appointment) => {
    const firstName = (client.name || "").trim().split(" ")[0];
    const where =
      appointment.location === "Domiciliar"
        ? " (atendimento domiciliar)"
        : appointment.location
        ? ` (${appointment.location})`
        : "";

    const message =
      `Olá ${firstName}, tudo bem? Aqui é a ${professionalShortName}. ` +
      `Passando para confirmar sua sessão de fisioterapia amanhã (${dateStringBR}) ` +
      `às ${appointment.time}${where}. Posso confirmar seu horário?`;

    const encodedMessage = encodeURIComponent(message);
    const phone = (client.phone || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  return (
    <div className="themed">
      <PageHeader title="AVISOS" />

      <h3 className="page-band">Sessões de amanhã ({dateStringBR})</h3>

      {appointments.length === 0 && <p>Nenhuma sessão para confirmar amanhã.</p>}

      <ul>
        {appointments.map((appointment) => {
          const client = getClient(appointment.clientId);
          if (!client) return null;

          return (
            <li key={appointment.id}>
              <span>
                {appointment.time} - {client.name}
                {appointment.location && (
                  <small className="patient-sub">{appointment.location}</small>
                )}
              </span>
              <a
                href={buildWhatsAppLink(client, appointment)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button>Enviar Aviso no WhatsApp</button>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}