import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

/* CONFIG */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;  // Token do bot do Telegram
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;  // ID do chat do Telegram

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

/* 2️⃣ CONSULTAR STATUS (🔥 SOLUÇÃO DEFINITIVA 🔥) */
app.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Consultando o status do pagamento com ID: ${id}`); // Log para depuração
    
    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    const paymentStatus = resposta.data.status;
    console.log(`Status do pagamento: ${paymentStatus}`); // Log do status

    if (paymentStatus === 'approved') {
      // Se o pagamento foi aprovado, enviar notificação no Telegram
      await enviarNotificacaoTelegram(id, paymentStatus);
    }

    res.json({ status: paymentStatus });
  } catch (err) {
    console.error("ERRO STATUS:", err.message);
    res.json({ status: "pending" });
  }
});

/* ENVIAR NOTIFICAÇÃO PARA TELEGRAM */
async function enviarNotificacaoTelegram(paymentId, paymentStatus) {
  try {
    // Log para verificar os dados antes de enviar a mensagem
    console.log(`Enviando notificação para Telegram... PaymentId: ${paymentId}, Status: ${paymentStatus}`);
    
    const mensagem = `✅ Pagamento aprovado! ID do pagamento: ${paymentId}, Status: ${paymentStatus}`;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const params = {
      chat_id: TELEGRAM_CHAT_ID,
      text: mensagem,
    };

    // Enviar a mensagem para o Telegram
    const resposta = await axios.post(url, params);

    console.log("Notificação enviada para o Telegram:", resposta.data); // Log para verificar se a resposta foi bem-sucedida
  } catch (err) {
    console.error("Erro ao enviar notificação no Telegram:", err.message);
  }
}

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});