import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* CONFIG */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

// 🔴 TELEGRAM
const TELEGRAM_TOKEN = process.env.TG_TOKEN; // ex: 123456:ABC...
const TELEGRAM_CHAT_ID = process.env.TG_CHAT_ID; // ex: 123456789

/* TESTE */
app.get("/", (req, res) => {
  res.send("API Pix online 🚀");
});

/* 1️⃣ CRIAR PIX */
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

/* 2️⃣ CONSULTAR STATUS */
app.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
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

/* 3️⃣ NOTIFICAR TELEGRAM 🔔 */
app.post("/telegram", async (req, res) => {
  try {
    const { nome, produto, valor, whatsapp, freefireId, tipo } = req.body;

    const mensagem = `
💰 *PIX APROVADO*

📦 Produto: *${produto}*
💵 Valor: *R$ ${Number(valor).toFixed(2).replace(".", ",")}*
👤 Nome: *${nome}*
📞 WhatsApp: *${whatsapp}*
🎮 Free Fire ID: *${freefireId || "BR MOD"}*
🧾 Tipo: *${tipo}*
⏰ ${new Date().toLocaleString("pt-BR")}
`;

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem,
        parse_mode: "Markdown"
      }
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("ERRO TELEGRAM:", e.message);
    res.status(500).json({ ok: false });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});