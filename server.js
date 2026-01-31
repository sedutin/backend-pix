import express from "express";
import axios from "axios";
import cors from "cors";
import wppconnect from "@wppconnect-team/wppconnect";

const app = express();

/* CONFIG */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

/* ===============================
   WHATSAPP - WPPCONNECT
================================ */

let wppClient = null;
let pagamentosNotificados = new Set();

wppconnect.create({
  session: "sedutin",
  autoClose: false,
  puppeteerOptions: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  },
  catchQR: (base64Qr) => {
    console.log("📲 COPIE O BASE64 ABAIXO E CONVERTA EM IMAGEM:");
    console.log(base64Qr);
  },
  statusFind: (status) => {
    console.log("📡 Status WhatsApp:", status);
  }
}).then(client => {
  wppClient = client;
  console.log("✅ WhatsApp conectado com sucesso");
}).catch(err => {
  console.error("❌ Erro WhatsApp:", err);
});

/* ===============================
   ROTAS
================================ */

app.get("/", (req, res) => {
  res.send("API Pix + WhatsApp online 🚀");
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

/* 2️⃣ STATUS + ENVIO AUTOMÁTICO WHATSAPP */
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

    if (
      status === "approved" &&
      wppClient &&
      !pagamentosNotificados.has(id)
    ) {
      pagamentosNotificados.add(id);

      const info = resposta.data;

      const mensagem = `
✅ PAGAMENTO CONFIRMADO

📦 Produto: ${info.description}
💰 Valor: R$ ${info.transaction_amount}

🕒 ${new Date().toLocaleString("pt-BR")}
`;

      await wppClient.sendText(
        "5574999249732@c.us", // SEU NÚMERO
        mensagem
      );
    }

    res.json({ status });
  } catch (err) {
    console.error("ERRO STATUS:", err.message);
    res.json({ status: "pending" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta " + PORT);
});