import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* ===========================
   CORS
=========================== */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());
app.use(express.json());

/* ===========================
   ENV
=========================== */
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

if (!ACCESS_TOKEN) {
  throw new Error("MP_TOKEN não definido");
}

/* ===========================
   TESTE
=========================== */
app.get("/", (req, res) => {
  res.send("API Pix online 🚀");
});

/* ===========================
   CRIAR PIX
=========================== */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email, pedidoId } = req.body;

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
        payer: { email },

        external_reference: pedidoId || "pedido_sem_id",

        notification_url: "https://SEU_DOMINIO.com/webhook",

        date_of_expiration: new Date(
          Date.now() + 30 * 60000
        ).toISOString()
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey
        }
      }
    );

    const pix =
      pagamento.data.point_of_interaction.transaction_data;

    res.json({
      id: pagamento.data.id,
      status: pagamento.data.status,
      qrCode: pix.qr_code,
      qrCodeBase64: pix.qr_code_base64
    });

  } catch (err) {
    console.error("ERRO MP:", err.response?.data || err.message);
    res.status(500).json({
      erro: "Erro ao gerar Pix",
      detalhe: err.response?.data
    });
  }
});

/* ===========================
   WEBHOOK MERCADO PAGO
=========================== */
app.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type !== "payment") {
      return res.sendStatus(200);
    }

    const paymentId = data.id;

    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    const payment = response.data;

    if (
      payment.status === "approved" &&
      payment.payment_method_id === "pix"
    ) {
      console.log("✅ PIX PAGO");
      console.log("ID:", payment.id);
      console.log("Valor:", payment.transaction_amount);
      console.log("Pedido:", payment.external_reference);

      /**
       * AQUI VOCÊ FAZ:
       * - atualizar banco
       * - liberar produto
       * - marcar pedido como pago
       */
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("ERRO WEBHOOK:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

/* ===========================
   START SERVER
=========================== */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
