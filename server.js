import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

/* MIDDLEWARES */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ENV */
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

/* TESTE */
app.get("/", (req, res) => {
  res.send("API Pix rodando 🚀");
});

/* CRIAR PIX */
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

    res.json({
      id: pagamento.data.id,
      status: pagamento.data.status,
      qr_code:
        pagamento.data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64:
        pagamento.data.point_of_interaction.transaction_data.qr_code_base64,
    });
  } catch (err) {
    console.error("ERRO MP:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

/* CONSULTAR STATUS (DIRETO NO MP) */
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

    res.json({
      status: resposta.data.status,
    });
  } catch (err) {
    console.error("Erro status:", err.message);
    res.json({ status: "pending" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});