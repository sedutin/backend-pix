import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const TELEGRAM_TOKEN = "8583766383:AAEtkX5UpHG7DlzSpcMzvxZzUaSamdOSwY0";
const CHAT_ID = "8321599291";

const pedidos = {}; // memória (simples e funcional)

// ====== GERAR PIX ======
app.post("/pix", async (req, res) => {
  const { valor, descricao } = req.body;

  try {
    // ⚠️ aqui você mantém SUA lógica atual de gerar Pix
    const pix = await axios.post(
      "SUA_API_PIX_AQUI",
      { valor, descricao }
    );

    const paymentId = pix.data.id;

    pedidos[paymentId] = {
      status: "pending",
      descricao
    };

    res.json(pix.data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar Pix" });
  }
});

// ====== STATUS PRO FRONT ======
app.get("/status/:id", (req, res) => {
  const pedido = pedidos[req.params.id];
  res.json({ status: pedido?.status || "pending" });
});

// ====== WEBHOOK DO PIX (QUANDO APROVAR) ======
app.post("/webhook-pix", async (req, res) => {
  const { paymentId } = req.body;

  if (!pedidos[paymentId]) return res.sendStatus(200);

  pedidos[paymentId].status = "paid";

  // 🔔 AVISA NO TELEGRAM
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: `💰 PIX APROVADO!\n\nPedido: ${pedidos[paymentId].descricao}`,
      reply_markup: {
        inline_keyboard: [[
          {
            text: "✅ LIBERAR PEDIDO",
            callback_data: `liberar_${paymentId}`
          }
        ]]
      }
    }
  );

  res.sendStatus(200);
});

// ====== BOTÃO LIBERAR ======
app.post("/telegram", async (req, res) => {
  const callback = req.body.callback_query;

  if (!callback) return res.sendStatus(200);

  const paymentId = callback.data.replace("liberar_", "");
  pedidos[paymentId].status = "approved";

  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: `✅ Pedido ${paymentId} liberado com sucesso`
    }
  );

  res.sendStatus(200);
});

app.listen(3000, () => console.log("🔥 Backend rodando"));