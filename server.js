import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* CONFIG BÁSICA */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Mercado Pago
const ACCESS_TOKEN = process.env.MP_TOKEN;

// Telegram
const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TG_CHAT_ID;

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

/* 2️⃣ CONSULTAR STATUS + NOTIFICAR TELEGRAM */
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

    const status = resposta.data.status;

    // 🔔 NOTIFICA TELEGRAM QUANDO APROVAR
    if (status === "approved") {
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
          chat_id: TELEGRAM_CHAT_ID,
          text: "💰 PIX APROVADO!\n\nUm pagamento foi confirmado no site Sedutin."
        }
      );
    }

    res.json({ status });
  } catch (err) {
    console.error("ERRO STATUS:", err.message);
    res.json({ status: "pending" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});