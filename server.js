import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

app.get("/", (req, res) => {
  res.send("API Pix online 🚀");
});

app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email } = req.body;

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
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(pagamento.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

app.get("/status/:id", async (req, res) => {
  const paymentId = req.params.id;

  try {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json({ status: response.data.status });

  } catch (err) {
    console.error("Erro status:", err.response?.data || err.message);
    res.status(500).json({ status: "error" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
