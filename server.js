import express from "express";
import axios from "axios";
import cors from "cors";
import fetch from "node-fetch"; // Usando a importação correta para node-fetch versão 3+

const app = express();

/* CONFIG */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;  // Token MercadoPago
const WHATSAPP_API_URL = 'https://api.zapier.com/hooks/catch/LUFNU88T4R1476TN/'; // Webhook Zap API
const WHATSAPP_PHONE = '5574999249732'; // Seu número de WhatsApp
const ZAP_API_TOKEN = 'LUFNU88T4R1476TN';  // Token de autenticação da API Zap

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
    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json({ status: resposta.data.status });

    // Se o pagamento for aprovado, envia a mensagem para o WhatsApp
    if (resposta.data.status === "approved") {
      const msg = `📦 NOVO PEDIDO PAGO\n\nProduto: ${resposta.data.description}\nValor: R$ ${resposta.data.transaction_amount}\nNome: ${resposta.data.payer.name}\nEmail: ${resposta.data.payer.email}`;
      await enviarMensagemWhatsApp(msg);
    }

  } catch (err) {
    console.error("ERRO STATUS:", err.message);
    res.json({ status: "pending" });
  }
});

/* Função para enviar a mensagem via WhatsApp */
async function enviarMensagemWhatsApp(msg) {
  const data = {
    message: msg,
    phone: WHATSAPP_PHONE // Seu número de WhatsApp
  };

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAP_API_TOKEN}` // Token de autenticação da API Zap
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('Mensagem enviada com sucesso!', result);
  } catch (err) {
    console.error('Erro ao enviar mensagem para WhatsApp:', err);
  }
}

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});