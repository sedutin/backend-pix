import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

/* 1️⃣ CRIAR PIX */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email } = req.body;

    const pagamento = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: descricao,
        payment_method_id: "pix",
        payer: { email },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(pagamento.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao criar Pix" });
  }
});

/* 2️⃣ STATUS — CONSULTA DIRETO NO MERCADO PAGO (🔥 PRINCIPAL) */
app.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    res.json({ status: resposta.data.status });
  } catch (err) {
    console.error("Erro status:", err.message);
    res.json({ status: "pending" });
  }
});

/* 3️⃣ WEBHOOK (BACKUP) */
app.post("/webhook", (req, res) => {
  console.log("Webhook recebido:", req.body);
  res.sendStatus(200);
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});