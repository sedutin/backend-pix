import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

if (!ACCESS_TOKEN) {
  throw new Error("MP_TOKEN não definido no .env");
}

/* ===========================
   ROTA TESTE
=========================== */
app.get("/", (req, res) => {
  res.send("API Pix Mercado Pago ONLINE 🚀");
});

/* ===========================
   CRIAR PIX
=========================== */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email, pedidoId } = req.body;

    if (!valor || !email) {
      return res.status(400).json({
        erro: "valor e email são obrigatórios"
      });
    }

    const pagamento = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: descricao || "Pagamento Pix",
        payment_method_id: "pix",
        payer: { email },
        external_reference: pedidoId || "pedido_sem_id",
        notification_url: "https://backend-pix-yn4k.onrender.com/webhook",
        date_of_expiration: new Date(
          Date.now() + 30 * 60000
        ).toISOString()
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${Date.now()}-${Math.random()}`
        }
      }
    );

    const pixData =
      pagamento.data.point_of_interaction.transaction_data;

    res.json({
      id: pagamento.data.id,
      status: pagamento.data.status,
      qrCode: pixData.qr_code,
      qrCodeBase64: pixData.qr_code_base64
    });

  } catch (err) {
    console.error("Erro Pix:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
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

    // Verificações de segurança
    if (
      payment.status === "approved" &&
      payment.payment_method_id === "pix"
    ) {
      console.log("✅ PIX CONFIRMADO");
      console.log("ID:", payment.id);
      console.log("Valor:", payment.transaction_amount);
      console.log("Pedido:", payment.external_reference);

      /**
       * AQUI VOCÊ DEVE:
       * - atualizar pedido no banco
       * - liberar produto
       * - enviar email
       * - etc
       */
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("Erro webhook:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

/* ===========================
   CONSULTAR STATUS (OPCIONAL)
=========================== */
app.get("/status/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json({
      status: response.data.status
    });

  } catch (err) {
    console.error("Erro status:", err.response?.data || err.message);
    res.status(500).json({ status: "error" });
  }
});

/* ===========================
   START SERVER
=========================== */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
