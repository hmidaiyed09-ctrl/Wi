import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2yPx9b3DOxQAry7N8FzHIikZROFNZmsw",
  authDomain: "quiz-tower-hj4k3.firebaseapp.com",
  projectId: "quiz-tower-hj4k3",
  storageBucket: "quiz-tower-hj4k3.firebasestorage.app",
  messagingSenderId: "190127005685",
  appId: "1:190127005685:web:900e6e6f39f7431900cabc"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
