
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQKv_UUQno7QKxu0VRf8aRATzsDSj-H78",
  authDomain: "agendador-teste-fda5d.firebaseapp.com",
  projectId: "agendador-teste-fda5d",
  storageBucket: "agendador-teste-fda5d.firebasestorage.app",
  messagingSenderId: "1070882240053",
  appId: "1:1070882240053:web:1841ef4ab7dbe08a8ba37c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);