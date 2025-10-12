import { db, auth } from "./firebase.js";
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authSection = document.getElementById("auth-section");
const chatSection = document.getElementById("chat-section");
const currentUserLabel = document.getElementById("currentUser");

let currentUser = null;

// 🔹 Register
registerBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) return alert("Isi username & password!");

  const userRef = doc(db, "users", username);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    alert("Username udah dipake!");
    return;
  }

  await setDoc(userRef, {
    uid: auth.currentUser.uid,
    password: password,
    contacts: []
  });

  localStorage.setItem("username", username);
  loginSuccess(username);
};

// 🔹 Login
loginBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  const userRef = doc(db, "users", username);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) return alert("User gak ditemukan!");
  if (docSnap.data().password !== password) return alert("Password salah!");

  localStorage.setItem("username", username);
  loginSuccess(username);
};

// 🔹 Logout
logoutBtn.onclick = () => {
  localStorage.removeItem("username");
  location.reload();
};

// 🔹 Auto Login
window.onload = () => {
  const savedUser = localStorage.getItem("username");
  if (savedUser) loginSuccess(savedUser);
};

// 🔹 Setelah login
function loginSuccess(username) {
  currentUser = username;
  authSection.style.display = "none";
  chatSection.style.display = "flex";
  currentUserLabel.textContent = username;

  window.currentUsername = username; // biar bisa diakses di chat.js
  import("./chat.js").then(() => console.log("Chat loaded"));
}
