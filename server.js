import express from "express";
import axios from "axios";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN; // TOKEN MERCADO PAGO

app.get("/", (req, res) => {
  res.send("🚀 API Pix Sedutin Online");
});

/* =========================
   CRIAR PIX
========================= */
app.post("/criar-pix", async (req, res) => {
  try {
    const { produto, valor, nome } = req.body;

    const idempotencyKey = crypto.randomUUID();

    const pagamento = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: produto,
        payment_method_id: "pix",
        payer: {
          first_name: nome,
          email: `cliente_${Date.now()}@sedutin.com`
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "X-Idempotency-Key": idempotencyKey
        }
      }
    );

    const pix =
      pagamento.data.point_of_interaction.transaction_data;

    res.json({
      pagamentoId: pagamento.data.id,
      qrCodeBase64: pix.qr_code_base64,
      copiaCola: pix.qr_code
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

/* =========================
   STATUS DO PIX
========================= */
app.get("/status-pix/:id", async (req, res) => {
  try {
    const pagamento = await axios.get(
      `https://api.mercadopago.com/v1/payments/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json({ status: pagamento.data.status });

  } catch (err) {
    res.status(500).json({ erro: "Erro status Pix" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 Pix online na porta " + PORT);
});
