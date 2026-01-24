import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* CORS */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ENV */
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
        payer: { email },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(pagamento.data);
  } catch (err) {
    console.error("Erro Pix:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

/* 2️⃣ CONSULTAR STATUS (OFICIAL MP) */
app.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    res.json({ status: resposta.data.status });
  } catch (err) {
    res.json({ status: "pending" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});