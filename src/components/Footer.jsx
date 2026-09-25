// src/components/Footer.jsx
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateBR(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getWeatherIcon(code, date) {
  const hour = date.getHours();
  const isNight = hour >= 18 || hour < 6;

  if (code === 0) return isNight ? "🌙" : "☀️";
  if (code === 1 || code === 2) return isNight ? "☁️" : "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if (code >= 61 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "🌨️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}

export default function Footer() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [cityName, setCityName] = useState("");
  const [weatherError, setWeatherError] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
          const weatherResponse = await fetch(weatherUrl);
          const weatherData = await weatherResponse.json();

          if (weatherData.current_weather) {
            setWeather({
              temperature: weatherData.current_weather.temperature,
              windspeed: weatherData.current_weather.windspeed,
              code: weatherData.current_weather.weathercode,
            });
          } else {
            setWeatherError(true);
          }
        } catch (err) {
          setWeatherError(true);
        }

        try {
          const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
          const geoResponse = await fetch(geoUrl);
          const geoData = await geoResponse.json();

          const city =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            geoData.address?.municipality ||
            "";

          setCityName(city);
        } catch (err) {
          setCityName("");
        }
      },
      () => setWeatherError(true)
    );
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const clientsSnapshot = await getDocs(collection(db, "clients"));
      const clientsList = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsList);

      const todayString = getTodayString();
      const appointmentsRef = collection(db, "appointments");
      const q = query(appointmentsRef, where("date", "==", todayString));
      const appointmentsSnapshot = await getDocs(q);

      const appointmentsList = appointmentsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.time.localeCompare(b.time));

      setTodayAppointments(appointmentsList);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (todayAppointments.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % todayAppointments.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [todayAppointments]);

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Cliente não encontrado";
  };

  const currentAppointment = todayAppointments[currentIndex];

  return (
    <div className="footer">
      <div className="footer-section footer-datetime">
        <span className="footer-time">{formatTime(now)}</span>
        <span className="footer-date">{formatDateBR(now)}</span>
      </div>

      <div className="footer-section footer-weather">
        {weatherError && <span>Clima indisponível</span>}
        {!weatherError && !weather && <span>Carregando clima...</span>}
        {weather && (
        <>
            <span className="footer-weather-icon">
            {getWeatherIcon(weather.code, now)}
            </span>
            <span>
            {Math.round(weather.temperature)}°C
            {cityName && ` · ${cityName}`}
            </span>
        </>
        )}
      </div>

      <div className="footer-section footer-carousel">
        {todayAppointments.length === 0 && (
          <span>Nenhum agendamento para hoje</span>
        )}

        {currentAppointment && (
          <span key={currentAppointment.id} className="footer-carousel-item">
            {currentAppointment.time} - {getClientName(currentAppointment.clientId)}
          </span>
        )}
      </div>
          <div className="footer-section footer-credit">
        <span>Desenvolvido por Carlos Eduardo Motta</span>
      </div>
    </div>
  );
}