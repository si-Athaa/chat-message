console.log("✅ chat.js loaded successfully");

import { db, storage } from "./firebase.js";
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, onSnapshot, query, orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const usernameDisplay = document.getElementById("currentUser");
const contactsList = document.getElementById("contacts");
const addContactInput = document.getElementById("addContact");
const addContactBtn = document.getElementById("addBtn");
const chatHeader = document.getElementById("chatWith");
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const fileInput = document.getElementById("fileInput");
const deleteAllBtn = document.getElementById("deleteAll");

let currentUsername = null;
let selectedContact = null;
let unsubscribeChat = null;

// 🔹 Initialize chat system after login
export async function initChat(username) {
console.log("🔹 initChat running for:", username);
  currentUsername = username;
  usernameDisplay.textContent = username;
  loadContacts();
}

// 🔹 Load contacts
async function loadContacts() {
  const snap = await getDoc(doc(db, "users", currentUsername));
  const contacts = (snap.exists() && Array.isArray(snap.data().contacts)) ? snap.data().contacts : [];

  contactsList.innerHTML = "";
  contacts.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    li.onclick = () => openChat(c);
    contactsList.appendChild(li);
  });
}

// 🔹 Add contact
addContactBtn.onclick = async () => {
  const newUser = addContactInput.value.trim();
  if (!newUser) return alert("Enter a username!");
  if (newUser === currentUsername) return alert("You cannot add yourself!");

  const targetSnap = await getDoc(doc(db, "users", newUser));
  if (!targetSnap.exists()) return alert("User not found!");

  const userRef = doc(db, "users", currentUsername);
  const data = (await getDoc(userRef)).data();
  const contacts = data.contacts || [];
  if (!contacts.includes(newUser)) {
    contacts.push(newUser);
    await setDoc(userRef, { ...data, contacts });
  }

  const otherRef = doc(db, "users", newUser);
  const otherData = (await getDoc(otherRef)).data();
  const otherContacts = otherData.contacts || [];
  if (!otherContacts.includes(currentUsername)) {
    otherContacts.push(currentUsername);
    await setDoc(otherRef, { ...otherData, contacts: otherContacts });
  }

  addContactInput.value = "";
  loadContacts();
};

// 🔹 Open chat with a contact
async function openChat(contact) {
  selectedContact = contact;
  chatHeader.textContent = `Chat with ${contact}`;
  chatBox.innerHTML = "";

  const chatId = [currentUsername, contact].sort().join("__");
  const msgRef = collection(db, "chats", chatId, "messages");

  if (unsubscribeChat) unsubscribeChat();

  const q = query(msgRef, orderBy("time", "asc"));
  unsubscribeChat = onSnapshot(q, (snap) => {
    chatBox.innerHTML = "";
    snap.forEach((d) => {
      const msg = d.data();
      const div = document.createElement("div");
      div.className = `message ${msg.user === currentUsername ? "me" : "other"}`;
      const timeStr = new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      div.innerHTML = `
        <b>${msg.user}:</b> ${msg.text || ""}
        ${msg.fileURL ? `<br><a href="${msg.fileURL}" target="_blank">📎 File</a>` : ""}
        <div class="timestamp">${timeStr}</div>
        ${msg.user === currentUsername ? `<button data-id="${d.id}" class="deleteMsg">🗑️</button>` : ""}
      `;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    });

    document.querySelectorAll(".deleteMsg").forEach(btn => {
      btn.onclick = async () => {
        const msgDoc = doc(msgRef, btn.dataset.id);
        const data = (await getDoc(msgDoc)).data();
        if (data.fileURL) {
          const fileRef = ref(storage, data.fileURL);
          try { await deleteObject(fileRef); } catch {}
        }
        await deleteDoc(msgDoc);
      };
    });
  });

  sendBtn.onclick = async () => {
    let fileURL = null;
    const file = fileInput.files[0];
    if (file) {
      const fileRef = ref(storage, `chatFiles/${chatId}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      fileURL = await getDownloadURL(fileRef);
      fileInput.value = "";
    }

    const text = msgInput.value.trim();
    if (!text && !fileURL) return;

    await addDoc(msgRef, {
      user: currentUsername,
      text: text || "",
      fileURL: fileURL || null,
      time: Date.now()
    });
    msgInput.value = "";
  };

  deleteAllBtn.onclick = async () => {
    if (confirm("Delete all chat messages?")) {
      const snap = await getDocs(msgRef);
      snap.forEach(async (m) => {
        const data = m.data();
        if (data.fileURL) {
          const fileRef = ref(storage, data.fileURL);
          try { await deleteObject(fileRef); } catch {}
        }
        await deleteDoc(m.ref);
      });
    }
  };
}
