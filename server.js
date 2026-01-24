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

/* ENV */
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

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

    res.json(pagamento.data);

  } catch (err) {
    console.error("Erro:", err.response?.data || err.message);
    res.status(500).json({
      erro: "Erro ao gerar Pix",
      detalhe: err.response?.data
    });
  }
});

/* Webhook do Mercado Pago para notificação de pagamento */
app.post("/webhook", (req, res) => {
  const data = req.body;

  // Verificar se o pagamento foi aprovado
  if (data?.data?.status === "approved") {
    const { transaction_amount, payer, id } = data.data;

    // Aqui, você pode realizar ações como enviar uma mensagem no WhatsApp automaticamente
    const mensagem = encodeURIComponent(`Pagamento recebido: R$ ${transaction_amount}\nID: ${id}\nCliente: ${payer.name}`);

    // Redirecionar automaticamente para o WhatsApp
    const urlZap = `https://wa.me/5574999249732?text=${mensagem}`;

    // Responder com o link de WhatsApp para o frontend
    res.json({ redirectTo: urlZap });
  } else {
    res.status(400).json({ erro: "Pagamento não aprovado" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
