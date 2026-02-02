import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* ================= CONFIG ================= */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/* ================= TESTE ================= */
app.get("/", (req, res) => {
  res.send("API Pix + Telegram online 🚀");
});

/* ================= FUNÇÃO TELEGRAM ================= */
async function enviarTelegram(mensagem) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: TELEGRAM_CHAT_ID,
    text: mensagem,
    parse_mode: "HTML"
  });
}

/* ================= 1️⃣ CRIAR PIX ================= */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email } = req.body;

    if (!valor || !email) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const pagamento = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: descricao || "Pagamento Pix",
        payment_method_id: "pix",
        payer: { email }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `pix-${Date.now()}`
        }
      }
    );

    res.json(pagamento.data);
  } catch (err) {
    console.error("ERRO PIX:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

/* ================= 2️⃣ STATUS PIX ================= */
app.get("/status/:id", async (req, res) => {
  try {
    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json({ status: resposta.data.status });
  } catch (err) {
    console.error("ERRO STATUS:", err.message);
    res.json({ status: "pending" });
  }
});

/* ================= 3️⃣ CONFIRMAR PAGAMENTO + TELEGRAM ================= */
app.post("/confirmar-pagamento", async (req, res) => {
  try {
    const {
      nome,
      whatsapp,
      freefireId,
      produto,
      valor,
      tipo
    } = req.body;

    const mensagem = `
💰 <b>PAGAMENTO APROVADO</b>

📦 <b>Produto:</b> ${produto}
💵 <b>Valor:</b> R$ ${Number(valor).toFixed(2).replace(".", ",")}

👤 <b>Nome:</b> ${nome}
📞 <b>WhatsApp:</b> ${whatsapp}
🎮 <b>ID FF:</b> ${freefireId || "BR MOD"}

🕒 <b>Data:</b> ${new Date().toLocaleString("pt-BR")}
    `;

    await enviarTelegram(mensagem);

    res.json({ ok: true });
  } catch (e) {
    console.error("ERRO TELEGRAM:", e.message);
    res.status(500).json({ erro: "Erro ao enviar Telegram" });
  }
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});