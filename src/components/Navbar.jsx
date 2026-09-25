// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Nome de exibição por e-mail. Adicione aqui os e-mails da sua equipe.
const DISPLAY_NAMES = {
  "kaddu108@gmail.com": "Carlos Eduardo",
  "jessyca@agendador.com.br": "Jéssyca Silva",
};



function getDisplayName(user) {
  if (!user) return "";
  if (user.displayName) return user.displayName;
  if (DISPLAY_NAMES[user.email]) return DISPLAY_NAMES[user.email];
  return user.email ? user.email.split("@")[0] : "";
}

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const displayName = getDisplayName(currentUser);

  return (
    <div className="navbar">
      <div className="navbar-header">
        <img src="/logo.png" alt="Agenda Fácil" className="navbar-logo" />
      </div>

      <span className="navbar-welcome">Bem-vindo(a), {displayName}</span>

      <div className="navbar-links">
        <Link to="/">Agenda</Link>
        <Link to="/clientes">Clientes</Link>
        <Link to="/avisos">Avisos</Link>
        <button
          className="navbar-logout navbar-logout-mobile"
          onClick={handleLogout}
        >
          Sair
        </button>
      </div>

      <button
        className="navbar-logout navbar-logout-desktop"
        onClick={handleLogout}
      >
        Sair
      </button>
    </div>
  );
}