// src/pages/Schedule.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import {
  getMonthDays,
  formatDateString,
  monthNames,
  weekDays,
} from "../utils/calendarUtils";
import {
  emptyAppointmentForm,
  appointmentToForm,
  buildAppointmentPayload,
  emptyRecordForm,
  buildRecordPayload,
} from "../utils/physioUtils";
import AppointmentModal from "../components/AppointmentModal";
import DayAppointmentsModal from "../components/DayAppointmentsModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import ClientCommentsModal from "../components/ClientCommentsModal";
import RecordModal from "../components/RecordModal";

export default function Schedule() {
  const today = new Date();
  const navigate = useNavigate();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [clients, setClients] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);

  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const [form, setForm] = useState(emptyAppointmentForm);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [returnToDay, setReturnToDay] = useState(false);

  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [commentsClient, setCommentsClient] = useState(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  // Registro do atendimento (prontuário) a partir de um agendamento
  const [recordForm, setRecordForm] = useState(emptyRecordForm);
  const [recordAppointment, setRecordAppointment] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const clientsRef = collection(db, "clients");
  const appointmentsRef = collection(db, "appointments");
  const recordsRef = collection(db, "records");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getClientName = (id) => {
    const client = clients.find((c) => c.id === id);
    return client ? client.name : "Paciente não encontrado";
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

  // Botão "Agendar Sessão" da tela principal
  const handleOpenCreateModal = () => {
    setForm({
      ...emptyAppointmentForm,
      date:
        selectedDay ||
        formatDateString(currentYear, currentMonth, today.getDate()),
    });
    setEditingId(null);
    setReturnToDay(false);
    setIsFormModalOpen(true);
  };

  // Agendar direto da grade do dia (clicando no horário ou no botão "+ Nova sessão")
  const handleCreateFromDayModal = (time = "") => {
    setForm({
      ...emptyAppointmentForm,
      date: selectedDay,
      time,
    });
    setEditingId(null);
    setReturnToDay(true);
    setIsDayModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleEditFromDayModal = (appointment) => {
    setForm(appointmentToForm(appointment));
    setEditingId(appointment.id);
    setReturnToDay(true);
    setIsDayModalOpen(false);
    setIsFormModalOpen(true);
  };

  // Abre as observações do cadastro do paciente do agendamento
  const handleViewComments = (appointment) => {
    const client = clients.find((c) => c.id === appointment.clientId);
    if (!client) {
      alert("Paciente não encontrado.");
      return;
    }
    setCommentsClient(client);
    setIsCommentsModalOpen(true);
  };

  // Vai para o prontuário do paciente
  const handleOpenRecord = (appointment) => {
    const client = clients.find((c) => c.id === appointment.clientId);
    if (!client) {
      alert("Paciente não encontrado.");
      return;
    }
    navigate(`/clientes/${client.id}/prontuario`);
  };

  // Abre a ficha de atendimento já preenchida com os dados do agendamento
  const handleRegisterFromAppointment = async (appointment) => {
    const client = clients.find((c) => c.id === appointment.clientId);
    if (!client) {
      alert("Paciente não encontrado.");
      return;
    }

    // Se o paciente ainda não tem nenhum atendimento, é a 1ª consulta
    const existing = await getDocs(
      query(recordsRef, where("patientId", "==", client.id))
    );
    const type = existing.empty ? "CONSULTA" : "RETORNO";

    const value =
      appointment.sessionValue ?? client.defaultSessionValue ?? "";

    setRecordForm({
      ...emptyRecordForm,
      type,
      date: appointment.date,
      location: appointment.location || client.defaultLocation || "Clínica",
      plan: appointment.plan || client.plan || "Particular",
      sessionValue: value === "" ? "" : String(value),
    });
    setRecordAppointment(appointment);
    setIsDayModalOpen(false);
    setIsRecordModalOpen(true);
  };

  const handleRecordChange = (e) => {
    setRecordForm({ ...recordForm, [e.target.name]: e.target.value });
  };

  const handleCloseRecordModal = () => {
    setIsRecordModalOpen(false);
    setRecordForm(emptyRecordForm);
    setRecordAppointment(null);
    if (selectedDay) setIsDayModalOpen(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordAppointment) return;

    const payload = buildRecordPayload(recordForm);

    const newRecord = await addDoc(recordsRef, {
      ...payload,
      patientId: recordAppointment.clientId,
      appointmentId: recordAppointment.id,
      createdAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, "appointments", recordAppointment.id), {
      status: "realizado",
      recordId: newRecord.id,
    });

    setIsRecordModalOpen(false);
    setRecordForm(emptyRecordForm);
    setRecordAppointment(null);
    await fetchAppointments();
    if (selectedDay) setIsDayModalOpen(true);
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

  // Ao escolher o paciente (novo agendamento), puxa plano, local e valor padrão
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "clientId" && !editingId) {
        const client = clients.find((c) => c.id === value);
        if (client) {
          next.plan = client.plan || prev.plan;
          next.location = client.defaultLocation || prev.location;
          next.sessionValue =
            client.defaultSessionValue !== undefined &&
            client.defaultSessionValue !== null
              ? String(client.defaultSessionValue)
              : prev.sessionValue;
        }
      }

      return next;
    });
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setForm(emptyAppointmentForm);
    setEditingId(null);

    if (returnToDay && selectedDay) {
      setIsDayModalOpen(true);
    }
    setReturnToDay(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const savedDate = form.date;
    const payload = buildAppointmentPayload(form);

    if (editingId) {
      await updateDoc(doc(db, "appointments", editingId), payload);
    } else {
      await addDoc(appointmentsRef, payload);
    }

    setIsFormModalOpen(false);
    setForm(emptyAppointmentForm);
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
        Agendar Sessão
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
          const activeCount = getAppointmentsForDate(dateString).filter(
            (a) => a.status !== "cancelado"
          ).length;

          return (
            <div
              key={dateString}
              className="calendar-day"
              onClick={() => handleDayClick(day)}
            >
              <span className="day-number">{day}</span>
              {activeCount > 0 && (
                <span className="day-badge">{activeCount}</span>
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
        onRegister={handleRegisterFromAppointment}
        onOpenRecord={handleOpenRecord}
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

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={handleCloseRecordModal}
        form={recordForm}
        onChange={handleRecordChange}
        onSubmit={handleRecordSubmit}
        isEditing={false}
        patientName={
          recordAppointment ? getClientName(recordAppointment.clientId) : ""
        }
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        message="Tem certeza que deseja excluir este agendamento?"
      />

      <ClientCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        client={commentsClient}
      />
    </div>
  );
}