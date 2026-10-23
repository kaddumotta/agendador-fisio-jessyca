// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Schedule from "./pages/Schedule";
import ClientRegister from "./pages/ClientRegister";
import PatientRecord from "./pages/PatientRecord";
import Finance from "./pages/Finance";
import Dashboard from "./pages/Dashboard";
import TomorrowReminders from "./pages/TomorrowReminders";
import "./App.css";
import "./physio.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-layout">
          <Navbar />
          <div className="content-area">
            <div className="container">
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Schedule />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/clientes"
                  element={
                    <PrivateRoute>
                      <ClientRegister />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/clientes/:id/prontuario"
                  element={
                    <PrivateRoute>
                      <PatientRecord />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/financeiro"
                  element={
                    <PrivateRoute>
                      <Finance />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/avisos"
                  element={
                    <PrivateRoute>
                      <TomorrowReminders />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </div>
            <Footer />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}