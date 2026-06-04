const MODEL = "openai/gpt-oss-120b";

/* ======================
   ELEMENT
====================== */
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const btn = document.getElementById("send-btn");


/* ======================
   STATE SYSTEM (DENGAN KUOTA HARIAN)
====================== */
const MAX_DAILY_QUOTA = 10; // 🎯 Ubah angka ini untuk menentukan batas chat per hari

let session = {
    user: 0,
    ai: 0,
    history: JSON.parse(localStorage.getItem("argumind_history")) || [],
    // Tambahkan data kuota di bawah ini
    chatCount: parseInt(localStorage.getItem("argumind_chat_count")) || 0,
    lastDate: localStorage.getItem("argumind_last_date") || ""
};

/* ======================
   DAILY QUOTA CHECKER
====================== */
function checkDailyQuota() {
    const today = new Date().toDateString(); // Mengambil tanggal hari ini

    // Jika tanggal terakhir berbeda dengan hari ini, reset hitungan chat jadi 0
    if (session.lastDate !== today) {
        session.chatCount = 0;
        session.lastDate = today;
        localStorage.setItem("argumind_chat_count", 0);
        localStorage.setItem("argumind_last_date", today);
    }

    // Mengembalikan sisa kuota hari ini
    return MAX_DAILY_QUOTA - session.chatCount;
}
let isLocked = false;


// 💡 FIX: Fungsi systemPrompt() yang duplikat & bocor sudah DIHAPUS dari sini, 
// karena aturan wajib sudah aman dikontrol langsung oleh server.js (Backend).


/* ======================
   CALL AI (YANG SUDAH DIPERBAIKI)
====================== */
async function getAI(message) {
    const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message,
            history: session.history.slice(-6)
        })
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "API Error");
    }

    return data.reply;
}

/* ======================
   ADD MESSAGE (FIX CHAT VERTICAL)
====================== */
function add(role, text) {
    const div = document.createElement("div");
    div.className = role === "user" ? "msg user-msg" : "msg ai-msg";

    div.innerHTML = role === "ai"
        ? (window.marked ? marked.parse(text) : text)
        : text;

    chatBox.appendChild(div);

    // FORCE VERTICAL CHAT
    chatBox.style.display = "flex";
    chatBox.style.flexDirection = "column";

    chatBox.scrollTop = chatBox.scrollHeight;

    session.history.push({ role, text });

    localStorage.setItem("argumind_history", JSON.stringify(session.history));

    if (role === "user") session.user++;
    else session.ai++;

    checkEnd();
}

/* ======================
   SEND MESSAGE (DENGAN VALIDASI KUOTA)
====================== */
btn.addEventListener("click", async () => {

    if (isLocked) return;

    // 1. Cek Sisa Kuota Terlebih Dahulu
    const remainingQuota = checkDailyQuota();
    if (remainingQuota <= 0) {
        add("ai", `🛑 **Kuota Harian Habis!** Kamu sudah mencapai batas ${MAX_DAILY_QUOTA} argumen hari ini. Silakan kembali lagi besok untuk melanjutkan debat!`);
        return;
    }

    const text = input.value.trim();
    if (!text) return;

    // 2. Tambah pesan user ke layar
    add("user", text);
    input.value = "";

    // 3. Tambahkan hitungan chat dan simpan ke LocalStorage
    session.chatCount++;
    localStorage.setItem("argumind_chat_count", session.chatCount);

    try {
        console.log(`Sisa kuota debat hari ini: ${MAX_DAILY_QUOTA - session.chatCount}`);
        
        const ai = await getAI(text);
        add("ai", ai);
    } catch (err) {
        add("ai", "Error: " + err.message);
    }
});

/* ======================
   ENTER KEY SUPPORT
====================== */
input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        btn.click();
    }
});

/* ======================
   COUNTER ARGUMENT (OTOMATIS)
====================== */
async function counterArgument() {
    // 1. Cari chat paling terakhir yang dikeluarkan oleh AI
    const lastAI = [...session.history]
        .reverse()
        .find(x => x.role === "ai");

    // Validasi kalau room chat masih kosong
    if (!lastAI) {
        alert("Belum ada argumen dari AI yang bisa kamu counter, bro!");
        return;
    }

    // 2. Cek apakah kuota harian masih ada
    const remainingQuota = checkDailyQuota();
    if (remainingQuota <= 0) {
        add("ai", `🛑 **Kuota Harian Habis!** Kamu sudah mencapai batas ${MAX_DAILY_QUOTA} argumen hari ini.`);
        return;
    }

    // 3. Ambil teks murni dari AI tersebut, lalu masukkan ke dalam kolom input website kamu
    // Ini membuat user melihat apa yang mau dibantah secara transparan
    input.value = `Bantah pernyataanmu yang ini: "${lastAI.text}". Berikan counter argument yang telak dan tajam!`;
    
    // 4. Picu/simulasikan klik pada tombol kirim (Send Button) secara otomatis!
    // Langkah ini akan langsung memproses kuota, memunculkan chat di layar, dan nembak API Groq
    btn.click();
}

/* ======================
   TOPIC GENERATOR
====================== */
function generateTopic() {
    const topics = [
        "Apakah AI lebih berbahaya dari manusia?",
        "Apakah sekolah masih relevan di era digital?",
        "Apakah media sosial merusak moral?",
        "Apakah uang adalah sumber kebahagiaan?",
        "Apakah pelemahan nilai mata uang adalah hal yang bagus?",
        "Apakah AI akan menggantikan manusia?",
        "Mengapa media sosial berbahaya bagi remaja?",
        "Apakah kuliah masih penting saat ini?",
        "Bagaimana uang digital mengubah masyarakat?",
        "Mengapa influencer dibayar sangat mahal?",
        "Apakah budaya asing merusak budaya lokal?",
        "Mengapa hukuman mati harus dihapus?",
        "Apakah smartphone harus dilarang di sekolah?",
        "Bagaimana prank memengaruhi moral masyarakat?",
        "Apakah cryptocurrency akan menggantikan uang biasa?",
        "Mengapa coding penting dipelajari di sekolah?",
        "Bagaimana work from home memengaruhi produktivitas?",
        "Apakah TikTok membawa dampak negatif?",
        "Mengapa beauty standard merusak mental remaja?",
        "Apakah plastik sekali pakai harus dilarang?",
        "Bagaimana e-sports menjadi olahraga resmi?",
        "Apakah pemilu online lebih efektif?",
        "Mengapa pemerintah perlu sensor internet?",
        "Bagaimana transportasi gratis mengurangi polusi?",
        "Apakah cancel culture berbahaya?",
        "Mengapa fresh graduate sulit mendapat pekerjaan?",
        "Bagaimana globalisasi memengaruhi nasionalisme?",
        "Apakah game online menyebabkan kecanduan?",
        "Kapan robot akan menggantikan manusia?",
        "Mengapa konten AI harus diberi label?",
        "Apakah nilai sekolah menentukan kesuksesan?",
        "Mengapa internet menjadi kebutuhan pokok?",
        "Bagaimana pajak orang kaya memengaruhi ekonomi?",
        "Apakah energi nuklir aman digunakan?",
        "Mengapa teknologi membuat manusia malas?",
        "Apakah sistem pemerintahan demokrasi itu bagus?"
    ];

    const t = topics[Math.floor(Math.random() * topics.length)];
    add("ai", "🎯 TOPIC: " + t);
}

/* ======================
   RESET CHAT (KUOTA TETAP AMAN)
====================== */
function resetChat() {
    chatBox.innerHTML = "";

    session = {
        user: 0,
        ai: 0,
        history: [],
        chatCount: parseInt(localStorage.getItem("argumind_chat_count")) || 0,
        lastDate: localStorage.getItem("argumind_last_date") || ""
    };

    localStorage.removeItem("argumind_history");
    isLocked = false;
    addWelcomeMessage();
}

/* ======================
   AUTO JUDGE (10 TURN)
====================== */
async function checkEnd() {
    const total = session.user + session.ai;

    if (total >= 10 && !isLocked) {
        isLocked = true;

        const prompt = `
Analisis debat berikut:

${session.history.map(x => x.role + ": " + x.text).join("\n")}

Berikan:
- score user vs ai (0-100)
- siapa pemenang
- kelemahan user
- kelemahan ai
- alasan singkat kemenangan
- berikan judgememt dan score secara adil dan tidak memihak
- berikan penilaian secara objektif
- maksimal total score gabungan mereka adalah 100
`;

        const result = await getAI(prompt);
        add("ai", "🏆 FINAL JUDGEMENT:\n\n" + result);
    }
}

/* ======================
   LOAD HISTORY ON START
====================== */
function loadHistory() {
    chatBox.innerHTML = "";

    session.history.forEach(m => {
        const div = document.createElement("div");
        div.className = m.role === "user" ? "msg user-msg" : "msg ai-msg";

        div.innerHTML = m.role === "ai"
            ? (window.marked ? marked.parse(m.text) : m.text)
            : m.text;

        chatBox.appendChild(div);
    });

    chatBox.style.display = "flex";
    chatBox.style.flexDirection = "column";
    chatBox.scrollTop = chatBox.scrollHeight;
}

/* ======================
   GLOBAL EXPORT (buat HTML button onclick)
====================== */
window.counterArgument = counterArgument;
window.generateTopic = generateTopic;
window.resetChat = resetChat;


function addWelcomeMessage() {
    if (session.history.length === 0) {
        add("ai", "Halo! Mulai debat Anda sekarang. Ajukan argumen pertama Anda.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, {
        threshold: 0.15
    });

    const hiddenElements = document.querySelectorAll(".animate-on-scroll");
    hiddenElements.forEach((el) => observer.observe(el));
});

loadHistory();
addWelcomeMessage();