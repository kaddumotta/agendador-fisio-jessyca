// src/pages/ClientRegister.jsx
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
import ClientModal from "../components/ClientModal";
import ClientCommentsModal from "../components/ClientCommentsModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

const emptyForm = { name: "", email: "", phone: "", comment: "" };

// Ignora maiúsculas/minúsculas e acentos na busca
const normalizeText = (text) =>
  (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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

function WhatsAppIcon() {
  return (
    <svg {...svgProps} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.888.523 3.65 1.432 5.156L2 22l4.964-1.404A9.958 9.958 0 0012.001 22C17.523 22 22 17.522 22 12S17.523 2 12.001 2zm0 18.062a8.02 8.02 0 01-4.086-1.121l-.293-.174-3.033.858.822-3.007-.19-.309A8.02 8.02 0 013.938 12c0-4.453 3.626-8.062 8.063-8.062 4.436 0 8.062 3.609 8.062 8.062 0 4.453-3.626 8.062-8.062 8.062z" />
    </svg>
  );
}

export default function ClientRegister() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [selectedClient, setSelectedClient] = useState(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const clientsRef = collection(db, "clients");

  const fetchClients = async () => {
    const snapshot = await getDocs(clientsRef);
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setClients(list);
  };

  useEffect(() => {
    fetchClients();
  }, []);

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
      name: client.name,
      email: client.email,
      phone: client.phone,
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

    const { name, email, phone, comment } = form;

    // O comentário é sempre único: substitui o que estava salvo
    const comments = comment.trim() !== "" ? [comment.trim()] : [];

    if (editingId) {
      await updateDoc(doc(db, "clients", editingId), {
        name,
        email,
        phone,
        comments,
      });
    } else {
      await addDoc(clientsRef, { name, email, phone, comments });
    }

    setIsFormModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    await fetchClients();
  };

  const handleDeleteRequest = (client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      await deleteDoc(doc(db, "clients", clientToDelete.id));
      await fetchClients();
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
      ? "Nenhum cliente encontrado para essa busca."
      : "Nenhum cliente cadastrado.";

  return (
    <div>
      <div className="clients-toolbar">
        <h2>Clientes</h2>

        <div className="clients-actions">
          <input
            type="search"
            className="clients-search"
            placeholder="Buscar cliente por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar cliente por nome"
          />

          <button className="btn-primary" onClick={handleOpenCreateModal}>
            Criar Registro
          </button>
        </div>
      </div>

      {filteredClients.length === 0 && (
        <p className="clients-empty">{emptyMessage}</p>
      )}

      <ul>
        {filteredClients.map((client) => (
          <li key={client.id}>
            <span>{client.name}</span>

            <div className="icon-actions">
              <button
                type="button"
                className="icon-btn icon-btn-edit"
                onClick={() => handleOpenEditModal(client)}
                aria-label="Editar cliente"
                title="Editar"
              >
                <EditIcon />
              </button>

              <button
                type="button"
                className="icon-btn icon-btn-delete"
                onClick={() => handleDeleteRequest(client)}
                aria-label="Excluir cliente"
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
                aria-label="Ver comentários"
                title="Comentários"
              >
                <CommentsIcon />
              </button>
            </div>
          </li>
        ))}
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
      />
    </div>
  );
}
