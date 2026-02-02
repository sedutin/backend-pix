import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* ================= CONFIG ================= */
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/* ================= CONTROLE ================= */
// Pagamentos pendentes → serão verificados automaticamente
const pagamentosPendentes = new Map(); 
// Pagamentos já notificados
const pagamentosNotificados = new Set();

/* ================= TELEGRAM ================= */
async function enviarTelegram(mensagem) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem,
        parse_mode: "HTML"
      }
    );
    console.log("📩 Telegram enviado");
  } catch (err) {
    console.error("❌ ERRO TELEGRAM:", err.message);
  }
}

/* ================= MERCADO PAGO ================= */
async function consultarPagamento(id) {
  const r = await axios.get(
    `https://api.mercadopago.com/v1/payments/${id}`,
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    }
  );
  return r.data;
}

/* ================= VERIFICADOR AUTOMÁTICO ================= */
setInterval(async () => {
  if (pagamentosPendentes.size === 0) return;

  for (const [id, dadosBase] of pagamentosPendentes) {
    try {
      const dados = await consultarPagamento(id);

      if (dados.status === "approved" && !pagamentosNotificados.has(id)) {
        pagamentosNotificados.add(id);
        pagamentosPendentes.delete(id);

        await enviarTelegram(
          `✅ <b>PAGAMENTO APROVADO</b>\n\n` +
          `💰 Valor: R$ ${dados.transaction_amount}\n` +
          `📧 Email: ${dados.payer.email}\n` +
          `🆔 ID: ${id}`
        );
      }

      if (["rejected", "cancelled"].includes(dados.status)) {
        pagamentosPendentes.delete(id);
      }

    } catch (err) {
      console.error("❌ ERRO VERIFICAÇÃO:", err.message);
    }
  }
}, 5000); // verifica a cada 5 segundos

/* ================= ROTAS ================= */
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

    const id = pagamento.data.id;

    // 🔥 adiciona à fila de verificação automática
    pagamentosPendentes.set(id, true);

    res.json(pagamento.data);

  } catch (err) {
    console.error("❌ ERRO PIX:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

/* ================= STATUS (OPCIONAL) ================= */
app.get("/status/:id", async (req, res) => {
  try {
    const dados = await consultarPagamento(req.params.id);
    res.json({ status: dados.status });
  } catch {
    res.json({ status: "pending" });
  }
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta " + PORT);
  console.log("🔁 Verificador automático de pagamentos ATIVO");
});