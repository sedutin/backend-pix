import express from "express";
import axios from "axios";
import cors from "cors";
import wppconnect from "@wppconnect-team/wppconnect";

const app = express();

/* ===============================
   CONFIG BÁSICA
================================ */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const MP_TOKEN = process.env.MP_TOKEN;

/* ===============================
   WHATSAPP (WPPCONNECT)
================================ */

let wppClient = null;

// evita mandar mensagem duplicada
const pagamentosNotificados = new Set();

wppconnect
  .create({
    session: "sedutin",
    autoClose: false,
    puppeteerOptions: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote"
      ]
    }
  })
  .then(client => {
    wppClient = client;
    console.log("✅ WhatsApp conectado com sucesso");
  })
  .catch(err => {
    console.error("❌ Erro ao iniciar WhatsApp:", err);
  });

/* ===============================
   ROTAS
================================ */

app.get("/", (req, res) => {
  res.send("🚀 API Pix + WhatsApp rodando");
});

/* ===============================
   1️⃣ GERAR PIX
================================ */
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
        payer: {
          email
        }
      },
      {
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `pix-${Date.now()}`
        }
      }
    );

    res.json(pagamento.data);
  } catch (err) {
    console.error("❌ Erro ao gerar Pix:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

/* ===============================
   2️⃣ CONSULTAR STATUS + NOTIFICAR WHATSAPP
================================ */
app.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`
        }
      }
    );

    const status = resposta.data.status;

    // se aprovado, envia WhatsApp automaticamente
    if (
      status === "approved" &&
      wppClient &&
      !pagamentosNotificados.has(id)
    ) {
      pagamentosNotificados.add(id);

      const info = resposta.data;

      const mensagem = `
✅ PAGAMENTO CONFIRMADO

📦 Produto: ${info.description}
💰 Valor: R$ ${info.transaction_amount}

🆔 ID Pagamento: ${info.id}
🕒 ${new Date().toLocaleString("pt-BR")}
      `;

      await wppClient.sendText(
        "5574999249732@c.us", // 🔴 COLOQUE SEU NÚMERO AQUI
        mensagem.trim()
      );

      console.log("📲 Mensagem enviada no WhatsApp");
    }

    res.json({ status });
  } catch (err) {
    console.error("❌ Erro ao consultar status:", err.message);
    res.json({ status: "pending" });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});