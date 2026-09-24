// // src/pages/Schedule.jsx
// import { useState, useEffect } from "react";
// import { db } from "../firebaseConfig";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   deleteDoc,
//   doc,
//   updateDoc,
// } from "firebase/firestore";
// import {
//   getMonthDays,
//   formatDateString,
//   monthNames,
//   weekDays,
// } from "../utils/calendarUtils";
// import AppointmentModal from "../components/AppointmentModal";
// import DayAppointmentsModal from "../components/DayAppointmentsModal";
// import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

// const emptyForm = { clientId: "", date: "", time: "", notes: "" };

// export default function Schedule() {
//   const today = new Date();

//   const [currentYear, setCurrentYear] = useState(today.getFullYear());
//   const [currentMonth, setCurrentMonth] = useState(today.getMonth());

//   const [clients, setClients] = useState([]);
//   const [allAppointments, setAllAppointments] = useState([]);

//   const [selectedDay, setSelectedDay] = useState(null);
//   const [isDayModalOpen, setIsDayModalOpen] = useState(false);

//   const [form, setForm] = useState(emptyForm);
//   const [isFormModalOpen, setIsFormModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   const [appointmentToDelete, setAppointmentToDelete] = useState(null);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

//   const clientsRef = collection(db, "clients");
//   const appointmentsRef = collection(db, "appointments");

//   const fetchClients = async () => {
//     const snapshot = await getDocs(clientsRef);
//     setClients(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
//   };

//   const fetchAppointments = async () => {
//     const snapshot = await getDocs(appointmentsRef);
//     setAllAppointments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
//   };

//   useEffect(() => {
//     fetchClients();
//     fetchAppointments();
//   }, []);

//   const getClientName = (id) => {
//     const client = clients.find((c) => c.id === id);
//     return client ? client.name : "Cliente não encontrado";
//   };

//   const getAppointmentsForDate = (dateString) => {
//     return allAppointments
//       .filter((a) => a.date === dateString)
//       .sort((a, b) => a.time.localeCompare(b.time));
//   };

//   const handlePrevMonth = () => {
//     if (currentMonth === 0) {
//       setCurrentMonth(11);
//       setCurrentYear(currentYear - 1);
//     } else {
//       setCurrentMonth(currentMonth - 1);
//     }
//   };

//   const handleNextMonth = () => {
//     if (currentMonth === 11) {
//       setCurrentMonth(0);
//       setCurrentYear(currentYear + 1);
//     } else {
//       setCurrentMonth(currentMonth + 1);
//     }
//   };

//   const handleDayClick = (day) => {
//     if (!day) return;
//     const dateString = formatDateString(currentYear, currentMonth, day);
//     setSelectedDay(dateString);
//     setIsDayModalOpen(true);
//   };

//   const handleOpenCreateModal = () => {
//     setForm({
//       ...emptyForm,
//       date: selectedDay || formatDateString(currentYear, currentMonth, today.getDate()),
//     });
//     setEditingId(null);
//     setIsFormModalOpen(true);
//   };

//   const handleEditFromDayModal = (appointment) => {
//     setForm({
//       clientId: appointment.clientId,
//       date: appointment.date,
//       time: appointment.time,
//       notes: appointment.notes || "",
//     });
//     setEditingId(appointment.id);
//     setIsDayModalOpen(false);
//     setIsFormModalOpen(true);
//   };

//   const handleDeleteRequest = (appointment) => {
//     setAppointmentToDelete(appointment);
//     setIsDeleteModalOpen(true);
//   };

//   const handleConfirmDelete = async () => {
//     if (appointmentToDelete) {
//       await deleteDoc(doc(db, "appointments", appointmentToDelete.id));
//       await fetchAppointments();
//     }
//     setIsDeleteModalOpen(false);
//     setAppointmentToDelete(null);
//   };

//   const handleFormChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleFormSubmit = async (e) => {
//     e.preventDefault();

//     if (editingId) {
//       await updateDoc(doc(db, "appointments", editingId), form);
//     } else {
//       await addDoc(appointmentsRef, form);
//     }

//     setIsFormModalOpen(false);
//     setForm(emptyForm);
//     setEditingId(null);
//     await fetchAppointments();

//     if (selectedDay) {
//       setIsDayModalOpen(true);
//     }
//   };

//   const days = getMonthDays(currentYear, currentMonth);

//   return (
//     <div>
//       <div className="calendar-header">
//         <button onClick={handlePrevMonth}>{"< Anterior"}</button>
//         <h2>
//           {monthNames[currentMonth]} {currentYear}
//         </h2>
//         <button onClick={handleNextMonth}>{"Próximo >"}</button>
//       </div>

//       <button className="btn-primary" onClick={handleOpenCreateModal}>
//         Realizar Agendamento
//       </button>

//       <div className="calendar-grid">
//         {weekDays.map((wd) => (
//           <div key={wd} className="calendar-weekday">
//             {wd}
//           </div>
//         ))}

//         {days.map((day, index) => {
//           if (!day) {
//             return <div key={`empty-${index}`} className="calendar-day empty" />;
//           }

//           const dateString = formatDateString(currentYear, currentMonth, day);
//           const dayAppointments = getAppointmentsForDate(dateString);

//           return (
//             <div
//               key={dateString}
//               className="calendar-day"
//               onClick={() => handleDayClick(day)}
//             >
//               <span className="day-number">{day}</span>
//               {dayAppointments.length > 0 && (
//                 <span className="day-badge">{dayAppointments.length}</span>
//               )}
//             </div>
//           );
//         })}
//       </div>

//       <DayAppointmentsModal
//         isOpen={isDayModalOpen}
//         onClose={() => setIsDayModalOpen(false)}
//         date={selectedDay}
//         appointments={selectedDay ? getAppointmentsForDate(selectedDay) : []}
//         getClientName={getClientName}
//         onEdit={handleEditFromDayModal}
//         onDelete={handleDeleteRequest}
//       />

//       <AppointmentModal
//         isOpen={isFormModalOpen}
//         onClose={() => {
//           setIsFormModalOpen(false);
//           setForm(emptyForm);
//           setEditingId(null);
//         }}
//         clients={clients}
//         form={form}
//         onChange={handleFormChange}
//         onSubmit={handleFormSubmit}
//         isEditing={!!editingId}
//       />

//       <ConfirmDeleteModal
//         isOpen={isDeleteModalOpen}
//         onCancel={() => setIsDeleteModalOpen(false)}
//         onConfirm={handleConfirmDelete}
//       />
//     </div>
//   );
// }


// src/pages/Schedule.jsx
import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  getMonthDays,
  formatDateString,
  monthNames,
  weekDays,
} from "../utils/calendarUtils";
import AppointmentModal from "../components/AppointmentModal";
import DayAppointmentsModal from "../components/DayAppointmentsModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import ClientCommentsModal from "../components/ClientCommentsModal";

const emptyForm = { clientId: "", date: "", time: "", notes: "" };

export default function Schedule() {
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [clients, setClients] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);

  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [returnToDay, setReturnToDay] = useState(false);

  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [commentsClient, setCommentsClient] = useState(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const clientsRef = collection(db, "clients");
  const appointmentsRef = collection(db, "appointments");

  const fetchClients = async () => {
    const snapshot = await getDocs(clientsRef);
    setClients(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchAppointments = async () => {
    const snapshot = await getDocs(appointmentsRef);
    setAllAppointments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchClients();
    fetchAppointments();
  }, []);

  const getClientName = (id) => {
    const client = clients.find((c) => c.id === id);
    return client ? client.name : "Cliente não encontrado";
  };

  const getAppointmentsForDate = (dateString) => {
    return allAppointments
      .filter((a) => a.date === dateString)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dateString = formatDateString(currentYear, currentMonth, day);
    setSelectedDay(dateString);
    setIsDayModalOpen(true);
  };

  // Botão "Realizar Agendamento" da tela principal
  const handleOpenCreateModal = () => {
    setForm({
      ...emptyForm,
      date: selectedDay || formatDateString(currentYear, currentMonth, today.getDate()),
    });
    setEditingId(null);
    setReturnToDay(false);
    setIsFormModalOpen(true);
  };

  // Agendar direto da grade do dia (clicando no horário ou no botão "+ Novo agendamento")
  const handleCreateFromDayModal = (time = "") => {
    setForm({
      ...emptyForm,
      date: selectedDay,
      time,
    });
    setEditingId(null);
    setReturnToDay(true);
    setIsDayModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleEditFromDayModal = (appointment) => {
    setForm({
      clientId: appointment.clientId,
      date: appointment.date,
      time: appointment.time,
      notes: appointment.notes || "",
    });
    setEditingId(appointment.id);
    setReturnToDay(true);
    setIsDayModalOpen(false);
    setIsFormModalOpen(true);
  };

  // Abre as observações do cadastro do cliente do agendamento
  const handleViewComments = (appointment) => {
    const client = clients.find((c) => c.id === appointment.clientId);
    if (!client) {
      alert("Cliente não encontrado.");
      return;
    }
    setCommentsClient(client);
    setIsCommentsModalOpen(true);
  };

  const handleDeleteRequest = (appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (appointmentToDelete) {
      await deleteDoc(doc(db, "appointments", appointmentToDelete.id));
      await fetchAppointments();
    }
    setIsDeleteModalOpen(false);
    setAppointmentToDelete(null);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);

    if (returnToDay && selectedDay) {
      setIsDayModalOpen(true);
    }
    setReturnToDay(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const savedDate = form.date;

    if (editingId) {
      await updateDoc(doc(db, "appointments", editingId), form);
    } else {
      await addDoc(appointmentsRef, form);
    }

    setIsFormModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    await fetchAppointments();

    if (returnToDay) {
      setSelectedDay(savedDate);
      setIsDayModalOpen(true);
    }
    setReturnToDay(false);
  };

  const days = getMonthDays(currentYear, currentMonth);

  return (
    <div>
      <div className="calendar-header">
        <button onClick={handlePrevMonth}>{"< Anterior"}</button>
        <h2>
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button onClick={handleNextMonth}>{"Próximo >"}</button>
      </div>

      <button className="btn-primary" onClick={handleOpenCreateModal}>
        Realizar Agendamento
      </button>

      <div className="calendar-grid">
        {weekDays.map((wd) => (
          <div key={wd} className="calendar-weekday">
            {wd}
          </div>
        ))}

        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="calendar-day empty" />;
          }

          const dateString = formatDateString(currentYear, currentMonth, day);
          const dayAppointments = getAppointmentsForDate(dateString);

          return (
            <div
              key={dateString}
              className="calendar-day"
              onClick={() => handleDayClick(day)}
            >
              <span className="day-number">{day}</span>
              {dayAppointments.length > 0 && (
                <span className="day-badge">{dayAppointments.length}</span>
              )}
            </div>
          );
        })}
      </div>

      <DayAppointmentsModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        date={selectedDay}
        appointments={selectedDay ? getAppointmentsForDate(selectedDay) : []}
        getClientName={getClientName}
        onEdit={handleEditFromDayModal}
        onDelete={handleDeleteRequest}
        onCreate={handleCreateFromDayModal}
        onViewComments={handleViewComments}
      />

      <AppointmentModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        clients={clients}
        form={form}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        isEditing={!!editingId}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <ClientCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        client={commentsClient}
      />
    </div>
  );
}