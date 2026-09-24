// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="navbar-header">
       <img src="/logo.png" alt="Agenda Fácil" className="navbar-logo" />

      </div>

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