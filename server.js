import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* CONFIG */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

/* TELEGRAM */
const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TG_CHAT_ID;

/* TESTE */
app.get("/", (req, res) => {
  res.send("API Pix + Telegram online 🚀");
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

/* 2️⃣ CONSULTAR STATUS */
app.get("/status/:id", async (req, res) => {
  try {
    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json({ status: resposta.data.status });
  } catch (e) {
    console.error("ERRO STATUS:", e.message);
    res.json({ status: "aguardando" });
  }
});

/* 3️⃣ NOTIFICAR TELEGRAM (CORRIGIDO) */
app.post("/notify", async (req, res) => {
  try {
    const {
      nome,
      whatsapp,
      produto,
      valor,
      tipo,
      freefireId
    } = req.body;

    const mensagem =
`🔥 NOVA COMPRA APROVADA

Produto: ${produto}
Valor: R$ ${Number(valor).toFixed(2)}
Nome: ${nome}
WhatsApp: ${whatsapp}
ID FF: ${freefireId || "BR MOD"}
Tipo: ${tipo}
Hora: ${new Date().toLocaleString("pt-BR")}
`;

    const tg = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem
      }
    );

    console.log("Telegram OK:", tg.data);
    res.json({ ok: true });

  } catch (e) {
    console.error("ERRO TELEGRAM:", e.response?.data || e.message);
    res.status(500).json({ erro: "Falha Telegram" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});