// src/pages/TomorrowReminders.jsx
import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

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
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => a.time.localeCompare(b.time));
    setAppointments(list);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getClient = (id) => {
    return clients.find((c) => c.id === id);
  };

  const buildWhatsAppLink = (client, time) => {
    const message = `Olá ${client.name}, confirmando seu horário amanhã (${dateStringBR}) às ${time}. Nos vemos lá!`;
    const encodedMessage = encodeURIComponent(message);
    const phone = client.phone.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  return (
    <div>
      <h2>Agendamentos de amanhã ({dateStringBR})</h2>

      {appointments.length === 0 && <p>Nenhum agendamento para amanhã.</p>}

      <ul>
        {appointments.map((appointment) => {
          const client = getClient(appointment.clientId);
          if (!client) return null;

          return (
            <li key={appointment.id}>
              <span>
                {appointment.time} - {client.name}
              </span>
              <a
                href={buildWhatsAppLink(client, appointment.time)}
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