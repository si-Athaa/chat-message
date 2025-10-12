// chat.js
import { db, auth, storage } from "./firebase.js";
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, onSnapshot, query, orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Referensi Elemen HTML
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
// const fileLabel = document.getElementById("fileLabel"); // Label untuk ikon file
const deleteAllBtn = document.getElementById("deleteAll");

let currentUser = null;
let selectedContact = null;
let unsubscribeChat = null;

// =======================================================
// 🔹 AUTENTIKASI DAN SETUP
// =======================================================

// 🔹 LOGIN ANONYMOUS
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = doc(db, "users", user.uid);
    const snap = await getDoc(userDoc);
    if (!snap.exists()) {
      const username = prompt("Masukkan username kamu:");
      // Validasi sederhana
      if (!username || username.trim() === "") {
        alert("Username tidak boleh kosong. Silakan muat ulang.");
        signOut(auth);
        return;
      }
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
    // Jika tidak ada user, coba login anonim
    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error("Gagal login anonim:", error);
        alert("Gagal terhubung ke Firebase. Cek konfigurasi Anda.");
    }
  }
});

// 🔹 LOGOUT
logoutBtn.onclick = () => {
    if (unsubscribeChat) unsubscribeChat(); // Hentikan listener
    signOut(auth);
    // Tambahkan reload atau redirect ke halaman login jika ada
};

// =======================================================
// 🔹 MANAJEMEN KONTAK
// =======================================================

// 🔹 LOAD CONTACTS
async function loadContacts() {
  const snap = await getDoc(doc(db, "users", currentUser.uid));
  const contacts = snap.data().contacts || [];
  contactsList.innerHTML = "";
  
  // Ambil username saat ini
  const myUsername = snap.data().username; 

  contacts.forEach(c => {
    // Jangan tampilkan diri sendiri di daftar kontak (jika ada)
    if (c === myUsername) return; 

    const li = document.createElement("li");
    li.textContent = c;
    li.onclick = () => {
        // Hapus class 'selected' dari semua kontak
        document.querySelectorAll("#contacts li").forEach(item => {
            item.classList.remove("selected");
        });
        // Tambahkan class 'selected' ke kontak yang diklik
        li.classList.add("selected");
        openChat(c);
    };
    contactsList.appendChild(li);
  });
}

// 🔹 TAMBAH KONTAK
addContactBtn.onclick = async () => {
  const newUser = addContactInput.value.trim();
  addContactInput.value = ""; // Bersihkan input
  
  if (!newUser || newUser === usernameDisplay.textContent) {
      return alert("Masukkan username yang valid (bukan diri sendiri)!");
  }
  
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
        alert(`Kontak ${newUser} berhasil ditambahkan!`);
      } else {
          alert(`Kontak ${newUser} sudah ada.`);
      }
      loadContacts();
    }
  });
  if (!found) alert(`User dengan username '${newUser}' tidak ditemukan!`);
};

// =======================================================
// 🔹 CHAT UTAMA
// =======================================================

// 🔹 BUKA CHAT DAN LISTENER
async function openChat(contact) {
  selectedContact = contact;
  chatHeader.textContent = `Chat with ${contact}`;
  chatBox.innerHTML = "";

  const mySnap = await getDoc(doc(db, "users", currentUser.uid));
  const myUsername = mySnap.data().username;
  
  // Buat ID chat yang konsisten (diurutkan)
  const chatId = [myUsername, contact].sort().join("__");
  const msgRef = collection(db, "chats", chatId, "messages");

  // Hentikan listener chat sebelumnya jika ada
  if (unsubscribeChat) unsubscribeChat();

  const q = query(msgRef, orderBy("time", "asc"));
  
  // Setup Real-time Listener (onSnapshot)
  unsubscribeChat = onSnapshot(q, (snap) => {
    chatBox.innerHTML = "";
    
    snap.forEach((d) => {
      const msg = d.data();
      const div = document.createElement("div");
      div.className = msg.user === myUsername ? "me" : "other"; // Menggunakan class .me/.other
      
      let fileLink = "";
      if (msg.fileURL) {
          // Tampilkan ikon dan link file
          fileLink = `<br><a href="${msg.fileURL}" target="_blank">📎 ${msg.fileType ? msg.fileType : 'File'}</a>`; 
      }
      
      let deleteButton = "";
      if (msg.user === myUsername) {
          // Gunakan class .deleteMsg untuk styling modern
          deleteButton = `<button data-id="${d.id}" data-file-url="${msg.fileURL || ''}" class="deleteMsg">🗑️</button>`;
      }
      
      div.innerHTML = `
        <div class="message-content">
          <b>${msg.user}:</b> ${msg.text || ""}
          ${fileLink}
        </div>
        ${deleteButton}
      `;
      
      chatBox.appendChild(div);
    });

    // 💡 FIX SCROLL OTOMATIS: Scroll ke bawah setiap kali ada pesan baru
    chatBox.scrollTop = chatBox.scrollHeight; 

    // Setup Event Listener untuk Tombol Hapus Pesan
    document.querySelectorAll(".deleteMsg").forEach(btn => {
      btn.onclick = async () => {
        const msgDoc = doc(msgRef, btn.dataset.id);
        const fileURL = btn.dataset.fileUrl; 
        
        if (!confirm("Yakin ingin menghapus pesan ini?")) return;

        // Hapus file dari Storage jika ada
        if (fileURL) {
          const fileRef = ref(storage, fileURL);
          try { await deleteObject(fileRef); } catch (e) { console.warn("Gagal menghapus file dari storage:", e); }
        }
        // Hapus dokumen pesan dari Firestore
        await deleteDoc(msgDoc);
      };
    });
  });

  // 🔹 FUNGSI KIRIM PESAN (SEND)
  sendBtn.onclick = async () => {
    let fileURL = null;
    let fileType = null;
    const file = fileInput.files[0];
    
    if (file) {
      fileType = file.name;
      // Upload file ke Storage
      const fileRef = ref(storage, `chatFiles/${chatId}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      fileURL = await getDownloadURL(fileRef);
      fileInput.value = ""; // Bersihkan input file
    }

    const text = msgInput.value.trim();
    if (!text && !fileURL) return; // Jangan kirim jika kosong

    // Kirim pesan ke Firestore
    await addDoc(msgRef, {
      user: myUsername,
      text: text || "",
      fileURL: fileURL || null,
      fileType: fileType || null,
      time: Date.now()
    });
    msgInput.value = ""; // Bersihkan input teks
  };
  
  // 🔹 FUNGSI HAPUS SEMUA PESAN
  deleteAllBtn.onclick = async () => {
    if (confirm("Yakin hapus semua chat? Aksi ini permanen!")) {
      const snap = await getDocs(msgRef);
      
      // Hapus semua file dan dokumen
      snap.forEach(async (m) => {
        const data = m.data();
        if (data.fileURL) {
          const fileRef = ref(storage, data.fileURL);
          try { await deleteObject(fileRef); } catch {}
        }
        await deleteDoc(m.ref);
      });
      alert("Semua pesan berhasil dihapus!");
    }
  };
}
