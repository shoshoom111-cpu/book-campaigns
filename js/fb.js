// الوسيط بين الصفحات و Firebase. الصفحتان تستخدمان window.FB فقط.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, onSnapshot, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const cfg = window.FIREBASE_CONFIG || {};
const ok = !!cfg.projectId && !/ضعي/.test(cfg.projectId + cfg.apiKey);
let auth = null, db = null;
if (ok) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);
}

async function list(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => Object.assign({}, d.data(), { id: d.id }));
}

window.FB = {
  ok,

  // ----- المديرة -----
  onAuth: cb => onAuthStateChanged(auth, cb),
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signOut: () => signOut(auth),
  resetPassword: email => { auth.languageCode = "ar"; return sendPasswordResetEmail(auth, email); },

  async loadAll() {
    const [authors, marketers, books, settings, codeSnap] = await Promise.all([
      list("authors"), list("marketers"), list("books"), getDoc(doc(db, "settings", "main")), getDocs(collection(db, "codes"))
    ]);
    const codes = {};
    codeSnap.docs.forEach(d => { codes[d.id] = d.data(); });
    return { authors, marketers, books, codes, template: settings.exists() ? settings.data().template : "" };
  },

  watchLinks(cb, onError) {
    return onSnapshot(collection(db, "links"), snap => {
      cb(snap.docs.map(d => {
        const x = d.data({ serverTimestamps: "estimate" });
        return { id: d.id, m: x.m, b: x.b, url: x.url, status: x.status, at: x.at && x.at.toMillis ? x.at.toMillis() : Date.now() };
      }));
    }, onError);
  },

  // ops: [{t:"set"|"upd"|"del", c:"collection", id, data}]
  async commit(ops) {
    for (let i = 0; i < ops.length; i += 400) {
      const batch = writeBatch(db);
      ops.slice(i, i + 400).forEach(o => {
        const ref = doc(db, o.c, o.id);
        if (o.t === "set") batch.set(ref, o.data);
        else if (o.t === "upd") batch.update(ref, o.data);
        else batch.delete(ref);
      });
      await batch.commit();
    }
  },

  // ----- المسوق (بدون حساب) -----
  async getCode(code) {
    const snap = await getDoc(doc(db, "codes", code));
    return snap.exists() ? snap.data() : null;
  },

  addLink(code, m, b, url) {
    return addDoc(collection(db, "links"), { code, m, b, url, status: "pending", at: serverTimestamp() });
  }
};
window.dispatchEvent(new Event("fb-ready"));
