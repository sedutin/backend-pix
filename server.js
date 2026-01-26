import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* CONFIG */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

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

    const status = resposta.data.status;
    res.json({ status });

    // Função para enviar a mensagem pelo WhatsApp usando APIDOZAP
    async function enviarWhatsApp(msg) {
      try {
        const response = await fetch("https://api.apidozap.com/sendMessage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer LUFNU88T4R1476TN` // Token da sua API APIDOZAP
          },
          body: JSON.stringify({
            phone: "74999249732", // Seu número do WhatsApp (sem o + ou espaços)
            message: msg
          })
        });

        if (!response.ok) throw new Error("Erro ao enviar WhatsApp");
        console.log("Mensagem enviada para o WhatsApp com sucesso!");
      } catch (err) {
        console.error("Erro ao enviar mensagem para o WhatsApp:", err);
      }
    }

    // Verificar se o pagamento foi aprovado
    if (status === "approved") {
      // Dados para enviar no WhatsApp
      const msg = encodeURIComponent(
        `📦 NOVO PEDIDO PAGO\n\n` +
        `Produto: ${req.body.descricao}\n` +
        `Valor: R$ ${req.body.valor}\n` +
        `Email do Cliente: ${req.body.email}`
      );

      // Envio automático para o WhatsApp do admin
      await enviarWhatsApp(msg); // Chama a função para enviar o WhatsApp

      console.log("Pagamento aprovado, notificação enviada!");
    }

  } catch (err) {
    console.error("ERRO STATUS:", err.message);
    res.json({ status: "pending" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});