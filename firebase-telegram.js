import admin from "firebase-admin";
import axios from "axios";

/* ================= VARIÁVEIS DE AMBIENTE ================= */
const {
  TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_DATABASE_URL
} = process.env;

/* ================= FIREBASE INIT ================= */
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  }),
  databaseURL: FIREBASE_DATABASE_URL
});

const db = admin.database();

/* ================= TELEGRAM ================= */
async function enviarTelegram(mensagem) {
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      chat_id: TELEGRAM_CHAT_ID,
      text: mensagem,
      parse_mode: "HTML"
    }
  );
}

/* ================= LISTENER COMPRAS ================= */
const comprasRef = db.ref("compras");

comprasRef.on("child_added", async (snapshot) => {
  const id = snapshot.key;
  const c = snapshot.val();

  if (!c) return;

  // 🛑 Já notificado
  if (c.telegram_notificado === true) return;

  const mensagem =
    `🛒 <b>NOVA COMPRA CONFIRMADA</b>\n\n` +
    `📦 Produto: ${c.produto || "-"}\n` +
    `👤 Nome: ${c.nome || "-"}\n` +
    `📞 WhatsApp: ${c.whatsapp || "-"}\n` +
    `🎮 Free Fire ID: ${c.freefireId || "-"}\n` +
    `🕒 Data: ${
      c.data ? new Date(c.data).toLocaleString("pt-BR") : "-"
    }\n` +
    `🆔 ID: ${id}`;

  try {
    await enviarTelegram(mensagem);

    // ✅ Marca como notificado (anti-duplicado definitivo)
    await db.ref(`compras/${id}/telegram_notificado`).set(true);

    console.log("✅ Telegram enviado:", id);
  } catch (err) {
    console.error("❌ Erro ao enviar Telegram:", err.message);
  }
});

console.log("🔥 Firebase → Telegram ativo");