import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* ================= CONFIG ================= */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

// Telegram
const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

/* ================= TESTE ================= */
app.get("/", (req, res) => {
  res.send("API Pix online 🚀");
});

/* ================= CRIAR PIX ================= */
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
    console.error("❌ ERRO AO GERAR PIX:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

/* ================= STATUS + VERIFICAÇÃO + TELEGRAM ================= */
app.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Função para verificar o status do pagamento
    const verificarPagamento = async (id) => {
      const resposta = await axios.get(
        `https://api.mercadopago.com/v1/payments/${id}`,
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`
          }
        }
      );

      return resposta.data.status;
    };

    // Verificar o status do pagamento
    let status = await verificarPagamento(id);
    
    // Loop para verificar o status até ele ser aprovado ou expirar
    let attempts = 0;
    const maxAttempts = 10; // Máximo de tentativas
    const delay = 3000; // Esperar 3 segundos entre cada tentativa

    while (status !== "approved" && attempts < maxAttempts) {
      attempts++;
      console.log(`Tentativa ${attempts}: status atual - ${status}`);
      await new Promise(resolve => setTimeout(resolve, delay)); // Espera de 3 segundos
      status = await verificarPagamento(id);
    }

    // Se o pagamento foi aprovado, notificar no Telegram
    if (status === "approved") {
      await axios.post(
        `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
        {
          chat_id: TG_CHAT_ID,
          text:
`💰 PIX APROVADO!

Um pagamento foi confirmado no site Sedutin.

⏰ ${new Date().toLocaleString("pt-BR")}`
        }
      );
    }

    res.json({ status });
  } catch (err) {
    console.error("❌ ERRO STATUS:", err.message);
    res.json({ status: "pending" });
  }
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta " + PORT);
});