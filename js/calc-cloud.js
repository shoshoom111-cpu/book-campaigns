// يربط الحاسبة بقاعدة البيانات: نفس حساب المديرة، والبيانات في المستند calc/main
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const cfg = window.FIREBASE_CONFIG || {};
const $ = id => document.getElementById(id);
const status = t => { $("cloudMsg").textContent = t; };

if (cfg.projectId && !/ضعي/.test(cfg.projectId + cfg.apiKey)) {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const ref = doc(db, "calc", "main");
  let timer = null, saving = false, dirty = false, ready = false;

  const gate = msg => {
    window.calcCloud = null; ready = false;
    if (msg) $("gateMsg").textContent = msg;
    $("gate").hidden = false;
  };

  async function push() {
    if (!ready) return;
    if (saving) { dirty = true; return; }
    saving = true; dirty = false; status("جارٍ الحفظ…");
    try {
      await setDoc(ref, { json: JSON.stringify(window.calcState()), at: serverTimestamp() });
      saving = false;
      if (dirty) push(); else status("محفوظ");
    } catch (e) {
      saving = false; dirty = true;
      status("تعذّر الحفظ، ستُعاد المحاولة…");
      clearTimeout(timer); timer = setTimeout(push, 5000);
    }
  }

  window.addEventListener("beforeunload", e => {
    if (ready && (saving || dirty || timer)) { e.preventDefault(); e.returnValue = ""; }
  });

  onAuthStateChanged(auth, async user => {
    if (!user) return gate("سجّلي الدخول من لوحة التحكم أولًا، ثم ارجعي هنا.");
    status("جارٍ التحميل…");
    try {
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().json) window.calcLoad(JSON.parse(snap.data().json));
      $("gate").hidden = true;
      ready = true;
      window.calcCloud = () => { dirty = true; clearTimeout(timer); timer = setTimeout(() => { timer = null; push(); }, 800); };
      if (snap.exists()) status("محفوظ"); else push(); // أول مرة: ترفع ما في هذا المتصفح
    } catch (e) {
      gate(e && e.code === "permission-denied" ? "هذا الحساب ليس حساب المديرة." : "تعذّر الاتصال بقاعدة البيانات. حدّثي الصفحة.");
    }
  });
}
