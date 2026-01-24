import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* CORS */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

const payments = new Map();

/* TESTE */
app.get("/", (req, res) => {
  res.send("API Pix online 🚀");
});

/* PIX */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email } = req.body;

    if (!valor || !email) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const idempotencyKey = `pix-${Date.now()}-${Math.random()}`;

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
          "X-Idempotency-Key": idempotencyKey
        }
      }
    );

    payments.set(pagamento.data.id.toString(), "pending");

    res.json(pagamento.data);

  } catch (err) {
    console.error("ERRO MP:", err.response?.data || err.message);
    res.status(500).json({
      erro: "Erro ao gerar Pix",
      detalhe: err.response?.data
    });
  }
});

/* WEBHOOK */
app.post("/webhook", async (req, res) => {
  const paymentId = req.body?.data?.id || req.body?.id;

  if (!paymentId) return res.sendStatus(200);

  try {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
      }
    );

    if (response.data.status === "approved") {
      payments.set(paymentId.toString(), "approved");
      console.log("Pagamento aprovado:", paymentId);
    }

  } catch (err) {
    console.error("Erro webhook:", err.response?.data || err.message);
  }

  res.sendStatus(200);
});

/* STATUS PARA SITE */
app.get("/status/:id", (req, res) => {
  const status = payments.get(req.params.id) || "pending";
  res.json({ status });
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
