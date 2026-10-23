// src/pages/ClientRegister.jsx  (lista de pacientes)
import { useState, useEffect, useMemo } from "react";
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
import ClientModal from "../components/ClientModal";
import ClientCommentsModal from "../components/ClientCommentsModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import {
  formatBRL,
  normalizeText,
  summarizeFinance,
  toNumber,
} from "../utils/physioUtils";

const emptyForm = {
  name: "",
  birthDate: "",
  sex: "",
  cpf: "",
  rg: "",
  address: "",
  phone: "",
  phoneLandline: "",
  email: "",
  plan: "Particular",
  defaultLocation: "Clínica",
  defaultSessionValue: "",
  comment: "",
};

const svgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
};

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function EditIcon() {
  return (
    <svg {...svgProps} {...strokeProps}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg {...svgProps} {...strokeProps}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CommentsIcon() {
  return (
    <svg {...svgProps} {...strokeProps}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function RecordIcon() {
  return (
    <svg {...svgProps} {...strokeProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg {...svgProps} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.888.523 3.65 1.432 5.156L2 22l4.964-1.404A9.958 9.958 0 0012.001 22C17.523 22 22 17.522 22 12S17.523 2 12.001 2zm0 18.062a8.02 8.02 0 01-4.086-1.121l-.293-.174-3.033.858.822-3.007-.19-.309A8.02 8.02 0 013.938 12c0-4.453 3.626-8.062 8.063-8.062 4.436 0 8.062 3.609 8.062 8.062 0 4.453-3.626 8.062-8.062 8.062z" />
    </svg>
  );
}

export default function ClientRegister() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [selectedClient, setSelectedClient] = useState(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const clientsRef = collection(db, "clients");

  const fetchAll = async () => {
    const [clientsSnap, recordsSnap, paymentsSnap] = await Promise.all([
      getDocs(collection(db, "clients")),
      getDocs(collection(db, "records")),
      getDocs(collection(db, "payments")),
    ]);

    const list = clientsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));

    setClients(list);
    setRecords(recordsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setPayments(paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Valor em aberto de cada paciente
  const balances = useMemo(() => {
    const map = {};
    clients.forEach((c) => {
      map[c.id] = summarizeFinance(
        records.filter((r) => r.patientId === c.id),
        payments.filter((p) => p.patientId === c.id)
      );
    });
    return map;
  }, [clients, records, payments]);

  const filteredClients = clients.filter((client) =>
    normalizeText(client.name).includes(normalizeText(search))
  );

  const handleOpenCreateModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    const lastComment =
      client.comments && client.comments.length > 0
        ? client.comments[client.comments.length - 1]
        : "";

    setForm({
      name: client.name || "",
      birthDate: client.birthDate || "",
      sex: client.sex || "",
      cpf: client.cpf || "",
      rg: client.rg || "",
      address: client.address || "",
      phone: client.phone || "",
      phoneLandline: client.phoneLandline || "",
      email: client.email || "",
      plan: client.plan || "Particular",
      defaultLocation: client.defaultLocation || "Clínica",
      defaultSessionValue:
        client.defaultSessionValue !== undefined &&
        client.defaultSessionValue !== null
          ? String(client.defaultSessionValue)
          : "",
      comment: lastComment,
    });
    setEditingId(client.id);
    setIsFormModalOpen(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const { comment, defaultSessionValue, ...rest } = form;

    // A observação geral é sempre única: substitui a que estava salva
    const comments = comment.trim() !== "" ? [comment.trim()] : [];

    const payload = {
      ...rest,
      name: rest.name.trim(),
      defaultSessionValue: toNumber(defaultSessionValue),
      comments,
    };

    if (editingId) {
      await updateDoc(doc(db, "clients", editingId), payload);
    } else {
      await addDoc(clientsRef, payload);
    }

    setIsFormModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    await fetchAll();
  };

  const handleDeleteRequest = async (client) => {
    // Preserva o histórico: paciente com prontuário não pode ser excluído
    const existing = await getDocs(
      query(collection(db, "records"), where("patientId", "==", client.id))
    );

    if (!existing.empty) {
      alert(
        "Este paciente já possui atendimentos no prontuário e não pode ser excluído, para preservar o histórico."
      );
      return;
    }

    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      await deleteDoc(doc(db, "clients", clientToDelete.id));
      await fetchAll();
    }
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const handleOpenComments = (client) => {
    setSelectedClient(client);
    setIsCommentsModalOpen(true);
  };

  const openWhatsApp = (client) => {
    const phone = (client.phone || "").replace(/\D/g, "");
    if (!phone) return;
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

  const emptyMessage =
    search.trim() !== ""
      ? "Nenhum paciente encontrado para essa busca."
      : "Nenhum paciente cadastrado.";

  return (
    <div>
      <div className="clients-toolbar">
        <h2>Pacientes</h2>

        <div className="clients-actions">
          <input
            type="search"
            className="clients-search"
            placeholder="Buscar paciente por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar paciente por nome"
          />

          <button className="btn-primary" onClick={handleOpenCreateModal}>
            Novo Paciente
          </button>
        </div>
      </div>

      {filteredClients.length === 0 && (
        <p className="clients-empty">{emptyMessage}</p>
      )}

      <ul>
        {filteredClients.map((client) => {
          const balance = balances[client.id];
          const open = balance ? balance.open : 0;

          return (
            <li key={client.id}>
              <span>
                <strong>{client.name}</strong>
                <small className="patient-sub">
                  {[client.plan, balance && `${balance.sessions} sessões`]
                    .filter(Boolean)
                    .join(" · ")}
                  {open > 0 && (
                    <span className="badge badge-open">
                      Em aberto: {formatBRL(open)}
                    </span>
                  )}
                </small>
              </span>

              <div className="icon-actions">
                <button
                  type="button"
                  className="icon-btn icon-btn-record"
                  onClick={() => navigate(`/clientes/${client.id}/prontuario`)}
                  aria-label="Abrir prontuário"
                  title="Prontuário"
                >
                  <RecordIcon />
                </button>

                <button
                  type="button"
                  className="icon-btn icon-btn-edit"
                  onClick={() => handleOpenEditModal(client)}
                  aria-label="Editar paciente"
                  title="Editar"
                >
                  <EditIcon />
                </button>

                <button
                  type="button"
                  className="icon-btn icon-btn-delete"
                  onClick={() => handleDeleteRequest(client)}
                  aria-label="Excluir paciente"
                  title="Excluir"
                >
                  <DeleteIcon />
                </button>

                <button
                  type="button"
                  className="icon-btn icon-btn-whatsapp"
                  onClick={() => openWhatsApp(client)}
                  aria-label="Abrir WhatsApp"
                  title="WhatsApp"
                >
                  <WhatsAppIcon />
                </button>

                <button
                  type="button"
                  className="icon-btn icon-btn-comments"
                  onClick={() => handleOpenComments(client)}
                  aria-label="Ver observações"
                  title="Observações"
                >
                  <CommentsIcon />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <ClientModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setForm(emptyForm);
          setEditingId(null);
        }}
        form={form}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        isEditing={!!editingId}
      />

      <ClientCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        client={selectedClient}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        message="Tem certeza que deseja excluir este paciente?"
      />
    </div>
  );
}