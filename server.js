import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

/* TESTE */
app.get("/", (req, res) => {
  res.send("API Pix online 🚀");
});

/* CRIAR PIX */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email } = req.body;

    const pagamento = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: descricao,
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

    const tx = pagamento.data.point_of_interaction.transaction_data;

    res.json({
      id: pagamento.data.id,
      qr_code: tx.qr_code,
      qr_code_base64: tx.qr_code_base64,
      status: pagamento.data.status,
    });
  } catch (err) {
    console.error("Erro MP:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

/* CONSULTAR STATUS */
app.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    res.json({ status: resposta.data.status });
  } catch {
    res.json({ status: "pending" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});