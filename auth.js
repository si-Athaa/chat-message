import { db, auth } from "./firebase.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logout");
const authSection = document.getElementById("auth-section");
const chatSection = document.getElementById("chat-section");
const currentUserLabel = document.getElementById("currentUser");

let currentUser = null;

// 🔹 Register
registerBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) return alert("Please fill username & password!");

  const userRef = doc(db, "users", username);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) return alert("Username already taken!");

  await setDoc(userRef, {
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

  if (!docSnap.exists()) return alert("User not found!");
  if (docSnap.data().password !== password) return alert("Wrong password!");

  localStorage.setItem("username", username);
  loginSuccess(username);
};

// 🔹 Auto Login
window.onload = () => {
  const savedUser = localStorage.getItem("username");
  if (savedUser) loginSuccess(savedUser);
};

// 🔹 Logout
logoutBtn.onclick = () => {
  localStorage.removeItem("username");
  location.reload();
};

// 🔹 After login success
async function loginSuccess(username) {
  currentUser = username;
  authSection.style.display = "none";
  chatSection.style.display = "flex";
  currentUserLabel.textContent = username;

  window.currentUsername = username; // make it accessible globally
  const { initChat } = await import("./chat.js");
  initChat(username);
}

