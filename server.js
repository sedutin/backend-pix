import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* CONFIG */
app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

/* TESTE */
app.get("/", (req, res) => {
  res.send("API Pix funcionando 🚀");
});

/* CRIAR PIX */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email } = req.body;

    if (!valor || Number(valor) <= 0 || !email) {
      return res.status(400).json({ erro: "Valor ou email inválido" });
    }

    const response = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(Number(valor).toFixed(2)),
        description: descricao || "Pagamento Pix",
        payment_method_id: "pix",
        payer: { email }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("ERRO PIX:", err.response?.data || err.message);
    res.status(500).json({
      erro: "Erro ao gerar Pix",
      detalhe: err.response?.data || err.message
    });
  }
});

/* CONSULTAR STATUS */
app.get("/status/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json({ status: response.data.status });
  } catch (err) {
    res.json({ status: "pending" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});