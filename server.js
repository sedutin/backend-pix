import express from "express";
import axios from "axios";
import cors from "cors";
import { iniciarWhatsApp, enviarMensagem } from "./whatsapp.js";

const app = express();

/* CONFIG */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

// 🔥 SEU NÚMERO DE WHATSAPP (DDD + 55)
const NUMERO_ADMIN = "5599999999999";

/* INICIA WHATSAPP */
iniciarWhatsApp();

/* TESTE */
app.get("/", (req, res) => {
  res.send("API Pix + WhatsApp online 🚀");
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

/* 3️⃣ ENVIAR WHATSAPP (🔥 AUTOMÁTICO 🔥) */
app.post("/enviar-whatsapp", async (req, res) => {
  try {
    const { msg } = req.body;

    if (!msg) {
      return res.status(400).json({ erro: "Mensagem vazia" });
    }

    await enviarMensagem(NUMERO_ADMIN, msg);

    res.json({ ok: true });
  } catch (err) {
    console.error("ERRO WHATSAPP:", err.message);
    res.status(500).json({ erro: "Falha ao enviar WhatsApp" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});