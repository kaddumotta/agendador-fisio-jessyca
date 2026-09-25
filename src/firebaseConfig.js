
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAcyLBm7CCHC0haKu-jb1rmCqfSXdV4xvg",
  authDomain: "site-reviva.firebaseapp.com",
  projectId: "site-reviva",
  storageBucket: "site-reviva.firebasestorage.app",
  messagingSenderId: "1021300073747",
  appId: "1:1021300073747:web:45a8ea2ac07991ad8f66e6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);