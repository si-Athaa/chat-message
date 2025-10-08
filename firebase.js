import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// 🧩 GANTI INI PAKE PUNYA LU SENDIRI
const firebaseConfig = {
  apiKey: "AIzaSyCKwFNQ4Fd6yoqjQTNhITdMXIZ0JNjD-lM",
  authDomain: "chat-message-421f7.firebaseapp.com",
  projectId: "chat-message-421f7",
  storageBucket: "chat-message-421f7.firebasestorage.app",
  messagingSenderId: "860970016891",
  appId: "1:860970016891:web:7483785c5338418fb442de"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Anonymous login otomatis
signInAnonymously(auth)
  .then(() => console.log("✅ Signed in anonymously"))
  .catch((e) => console.error(e));

export { db, auth };
