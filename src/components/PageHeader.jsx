// src/components/PageHeader.jsx  (título das páginas com logo e imagem)
import { PROFESSIONAL } from "../utils/physioUtils";

export default function PageHeader({ title, className = "" }) {
  return (
    <header className={`page-title ${className}`}>
      <img src="/logo%20J.png" alt="Logo" className="page-title-logo" />
      <div className="page-title-text">
        <h2>{title}</h2>
        <small>
          {PROFESSIONAL.name} · {PROFESSIONAL.crefito}
        </small>
      </div>
      <img
        src="/fisioterapia.png"
        alt="Fisioterapia"
        className="page-title-art"
      />
    </header>
  );
}
