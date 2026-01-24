import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* CORS */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ENV */
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

/* Banco fake em memória */
const pagamentos = {};

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
        payer: { email },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `pix-${Date.now()}`
        },
      }
    );

    const id = pagamento.data.id;

    pagamentos[id] = { status: "pending" };

    res.json(pagamento.data);
  } catch (err) {
    console.error("ERRO MP:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

/* 2️⃣ WEBHOOK (opcional, mas recomendado) */
app.post("/webhook", async (req, res) => {
  try {
    const paymentId = req.body?.data?.id;
    if (!paymentId) return res.sendStatus(200);

    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    const status = resposta.data.status;

    if (pagamentos[paymentId]) {
      pagamentos[paymentId].status = status;
    }

    console.log("Pix atualizado:", paymentId, status);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

/* 3️⃣ CONSULTAR STATUS */
app.get("/status/:id", (req, res) => {
  const status = pagamentos[req.params.id]?.status || "pending";
  res.json({ status });
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});