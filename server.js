import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MP_TOKEN = process.env.MP_TOKEN;

/* TELEGRAM */
const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

/* CACHE DE PAGAMENTOS NOTIFICADOS */
const pagamentosNotificados = new Set();

/* TESTE */
app.get("/", (req, res) => {
  res.send("API Pix + Telegram ONLINE 🚀");
});

/* FUNÇÃO TELEGRAM */
async function enviarTelegram(msg) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
      {
        chat_id: TG_CHAT_ID,
        text: msg,
        parse_mode: "HTML"
      }
    );
  } catch (e) {
    console.error("Erro Telegram:", e.message);
  }
}

/* CRIAR PIX */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email, dadosCompra } = req.body;

    if (!valor || !email || !dadosCompra) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const pagamento = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: descricao,
        payment_method_id: "pix",
        payer: { email }
      },
      {
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`,
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

/* STATUS + TELEGRAM */
app.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`
        }
      }
    );

    const status = resposta.data.status;
    const info = resposta.data.description;

    /* NOTIFICA UMA ÚNICA VEZ */
    if (status === "approved" && !pagamentosNotificados.has(id)) {
      pagamentosNotificados.add(id);

      const msg = `
<b>✅ PAGAMENTO APROVADO</b>

🆔 <b>ID:</b> ${id}
📦 <b>Descrição:</b> ${info}
💰 <b>Valor:</b> R$ ${resposta.data.transaction_amount}

🕒 ${new Date().toLocaleString("pt-BR")}
`;
      enviarTelegram(msg);
    }

    res.json({ status });
  } catch (err) {
    res.json({ status: "aguardando" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});