import admin from "firebase-admin";
import axios from "axios";

/* =========================
   ENV (Render)
========================= */
const {
  TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_DATABASE_URL
} = process.env;

/* =========================
   FIREBASE ADMIN
========================= */
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  }),
  databaseURL: FIREBASE_DATABASE_URL
});

const db = admin.database();

console.log("🔥 Listener Firebase → Telegram iniciado");

/* =========================
   FUNÇÃO TELEGRAM
========================= */
async function enviarTelegram(compra) {
  const mensagem = `
🛒 *NOVA COMPRA APROVADA*

📦 Produto: ${compra.produto || "-"}
👤 Nome: ${compra.nome || "-"}
📞 WhatsApp: ${compra.whatsapp || "-"}
🎮 ID FF: ${compra.freefireId || "-"}
💰 Valor: ${compra.valor || "-"}
🕒 Data: ${new Date(compra.data || Date.now()).toLocaleString("pt-BR")}
`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem,
        parse_mode: "Markdown"
      }
    );

    console.log("📩 Telegram enviado");
  } catch (err) {
    console.error("❌ Erro Telegram:", err.message);
  }
}

/* =========================
   LISTENER REALTIME DATABASE
========================= */
const comprasRef = db.ref("compras");

comprasRef.on("child_added", snapshot => {
  const compra = snapshot.val();

  // evita enviar compras antigas ao iniciar
  if (!compra || compra.notificado) return;

  enviarTelegram(compra);

  // marca como notificado
  snapshot.ref.update({ notificado: true });
});