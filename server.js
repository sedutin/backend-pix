import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MP_TOKEN = process.env.MP_TOKEN;

// 🤖 Telegram
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 🧠 Cache simples para evitar dupla notificação
const pagamentosNotificados = new Set();

/* TESTE */
app.get("/", (req, res) => {
  res.send("🔥 Backend Pix + Telegram ONLINE");
});

/* CRIAR PIX */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email, cliente } = req.body;

    if (!valor || !cliente?.nome || !cliente?.whatsapp) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const pagamento = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: descricao,
        payment_method_id: "pix",
        payer: { email },
        metadata: {
          nome: cliente.nome,
          whatsapp: cliente.whatsapp,
          freefireId: cliente.freefireId || "BR MOD",
          produto: descricao
        }
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
  } catch (e) {
    console.error("ERRO PIX:", e.response?.data || e.message);
    res.status(500).json({ erro: "Erro ao criar Pix" });
  }
});

/* STATUS + TELEGRAM */
app.get("/status/:id", async (req, res) => {
  try {
    const r = await axios.get(
      `https://api.mercadopago.com/v1/payments/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`
        }
      }
    );

    const p = r.data;

    if (p.status === "approved" && !pagamentosNotificados.has(p.id)) {
      pagamentosNotificados.add(p.id);

      const m = p.metadata;

      const mensagem = `
✅ *PIX APROVADO*

👤 *Nome:* ${m.nome}
📞 *WhatsApp:* ${m.whatsapp}
🎮 *Free Fire ID:* ${m.freefireId}
📦 *Produto:* ${m.produto}
💰 *Valor:* R$ ${p.transaction_amount.toFixed(2)}

🕒 ${new Date().toLocaleString("pt-BR")}
      `;

      await bot.sendMessage(CHAT_ID, mensagem, {
        parse_mode: "Markdown"
      });
    }

    res.json({ status: p.status });
  } catch (e) {
    res.json({ status: "aguardando" });
  }
});

app.listen(PORT, () => {
  console.log("🚀 Backend rodando na porta " + PORT);
});