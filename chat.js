import { db } from "./firebase.js";
import {
  doc, setDoc, getDoc, updateDoc, arrayUnion,
  collection, addDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const contactList = document.getElementById("contactList");
const addContactInput = document.getElementById("addContactInput");
const addContactBtn = document.getElementById("addContactBtn");
const messagesDiv = document.getElementById("messages");
const chatWithLabel = document.getElementById("chatWith");
const messageBox = document.getElementById("messageBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentChatUser = null;

// 🔹 Load contacts
async function loadContacts() {
  const userRef = doc(db, "users", window.currentUsername);
  const userSnap = await getDoc(userRef);
  const contacts = userSnap.data().contacts || [];

  contactList.innerHTML = "";
  contacts.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    li.onclick = () => openChat(c);
    contactList.appendChild(li);
  });
}

// 🔹 Add contact
addContactBtn.onclick = async () => {
  const contactName = addContactInput.value.trim();
  if (!contactName) return;

  const contactRef = doc(db, "users", contactName);
  const contactSnap = await getDoc(contactRef);
  if (!contactSnap.exists()) return alert("User gak ditemukan!");

  const userRef = doc(db, "users", window.currentUsername);
  await updateDoc(userRef, {
    contacts: arrayUnion(contactName)
  });

  loadContacts();
  addContactInput.value = "";
};

// 🔹 Open chat
async function openChat(contact) {
  currentChatUser = contact;
  chatWithLabel.textContent = `Chat with ${contact}`;
  messageBox.style.display = "flex";
  messagesDiv.innerHTML = "";

  const chatId = [window.currentUsername, contact].sort().join("__");
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("time"));

  onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.className = msg.user === window.currentUsername ? "msg me" : "msg other";
      div.textContent = `${msg.user}: ${msg.text}`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// 🔹 Send message
sendBtn.onclick = async () => {
  if (!currentChatUser) return;
  const text = messageInput.value.trim();
  if (!text) return;

  const chatId = [window.currentUsername, currentChatUser].sort().join("__");
  const messagesRef = collection(db, "chats", chatId, "messages");

  await addDoc(messagesRef, {
    user: window.currentUsername,
    text,
    time: Date.now()
  });

  messageInput.value = "";
};

loadContacts();
