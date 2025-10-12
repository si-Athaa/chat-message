// chat.js
import { db, auth, storage } from "./firebase.js";
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, onSnapshot, query, orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const usernameDisplay = document.getElementById("username");
const contactsList = document.getElementById("contacts");
const logoutBtn = document.getElementById("logout");
const addContactInput = document.getElementById("addContact");
const addContactBtn = document.getElementById("addBtn");
const chatHeader = document.getElementById("chatWith");
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const fileInput = document.getElementById("fileInput");
const deleteAllBtn = document.getElementById("deleteAll");

let currentUser = null;
let selectedContact = null;
let unsubscribeChat = null;

// 🔹 LOGIN ANONYMOUS
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = doc(db, "users", user.uid);
    const snap = await getDoc(userDoc);
    if (!snap.exists()) {
      const username = prompt("Masukkan username kamu:");
      await setDoc(userDoc, {
        uid: user.uid,
        username: username,
        contacts: []
      });
      usernameDisplay.textContent = username;
    } else {
      usernameDisplay.textContent = snap.data().username;
    }
    loadContacts();
  } else {
    await signInAnonymously(auth);
  }
});

// 🔹 LOGOUT
logoutBtn.onclick = () => signOut(auth);

// 🔹 LOAD CONTACTS
async function loadContacts() {
  const snap = await getDoc(doc(db, "users", currentUser.uid));
  const contacts = snap.data().contacts || [];
  contactsList.innerHTML = "";
  contacts.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    li.onclick = () => openChat(c);
    contactsList.appendChild(li);
  });
}

// 🔹 TAMBAH KONTAK
addContactBtn.onclick = async () => {
  const newUser = addContactInput.value.trim();
  if (!newUser) return alert("Masukkan username dulu!");
  const allUsers = await getDocs(collection(db, "users"));
  let found = false;
  allUsers.forEach(async (u) => {
    if (u.data().username === newUser) {
      found = true;
      const userRef = doc(db, "users", currentUser.uid);
      const data = (await getDoc(userRef)).data();
      const contacts = data.contacts || [];
      if (!contacts.includes(newUser)) {
        contacts.push(newUser);
        await setDoc(userRef, { ...data, contacts });
      }
      loadContacts();
    }
  });
  if (!found) alert("User tidak ditemukan!");
};

// 🔹 BUKA CHAT
async function openChat(contact) {
  selectedContact = contact;
  chatHeader.textContent = `Chat with ${contact}`;
  chatBox.innerHTML = "";

  const mySnap = await getDoc(doc(db, "users", currentUser.uid));
  const myUsername = mySnap.data().username;
  const chatId = [myUsername, contact].sort().join("__");
  const msgRef = collection(db, "chats", chatId, "messages");

  if (unsubscribeChat) unsubscribeChat();

  const q = query(msgRef, orderBy("time", "asc"));
  unsubscribeChat = onSnapshot(q, (snap) => {
    chatBox.innerHTML = "";
    snap.forEach((d) => {
      const msg = d.data();
      const div = document.createElement("div");
      div.className = msg.user === myUsername ? "me" : "other";
      div.innerHTML = `
        <b>${msg.user}:</b> ${msg.text || ""}
        ${msg.fileURL ? `<br><a href="${msg.fileURL}" target="_blank">📎 File</a>` : ""}
        ${msg.user === myUsername ? `<button data-id="${d.id}" class="deleteMsg">🗑️</button>` : ""}
      `;
      chatBox.appendChild(div);
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
      user: myUsername,
      text: text || "",
      fileURL: fileURL || null,
      time: Date.now()
    });
    msgInput.value = "";
  };

  deleteAllBtn.onclick = async () => {
    if (confirm("Yakin hapus semua chat?")) {
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
