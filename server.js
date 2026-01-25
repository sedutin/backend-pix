import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

// memória simples
let pedidos = {};

/* TESTE */
app.get("/", (req, res) => {
  res.send("API Pix online 🚀");
});

/* CRIAR PIX */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, nome, telefone } = req.body;

    const pagamento = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: descricao,
        payment_method_id: "pix",
        payer: { email: "cliente@pix.com" }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    pedidos[pagamento.data.id] = {
      nome,
      telefone,
      descricao,
      valor,
      liberado: false
    };

    res.json(pagamento.data);
  } catch (e) {
    res.status(500).json({ erro: "Erro Pix" });
  }
});

/* STATUS PIX */
app.get("/status/:id", async (req, res) => {
  try {
    const r = await axios.get(
      `https://api.mercadopago.com/v1/payments/${req.params.id}`,
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
      }
    );
    res.json({ status: r.data.status });
  } catch {
    res.json({ status: "pending" });
  }
});

/* CLIENTE ESPERA LIBERAÇÃO */
app.get("/liberado/:id", (req, res) => {
  res.json({ liberado: pedidos[req.params.id]?.liberado || false });
});

/* ADMIN LIBERA */
app.post("/liberar/:id", (req, res) => {
  if (pedidos[req.params.id]) {
    pedidos[req.params.id].liberado = true;
  }
  res.json({ ok: true });
});

/* LISTA ADMIN */
app.get("/admin/pedidos", (req, res) => {
  res.json(pedidos);
});

app.listen(PORT, () =>
  console.log("Servidor rodando na porta " + PORT)
);