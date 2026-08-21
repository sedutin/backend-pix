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
  res.json({
    online: true,
    empresa: "SEDUTIN VENDAS"
  });
});

/* PIX */
app.post("/pix", async (req, res) => {
  try {
    console.log("Recebendo pedido PIX:", req.body);

    const { valor, descricao, email } = req.body;

    if (!valor || !email) {
      return res.status(400).json({
        erro: "Valor e email são obrigatórios"
      });
    }

    if (!ACCESS_TOKEN) {
      return res.status(500).json({
        erro: "MP_TOKEN não configurado"
      });
    }

    const resposta = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: descricao || "Pagamento Pix",
        payment_method_id: "pix",
        payer: {
          email: email
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${Date.now()}`
        }
      }
    );

    console.log("Pagamento criado:", resposta.data.id);

    const dados =
      resposta.data.point_of_interaction?.transaction_data;

    res.json({
      id: resposta.data.id,
      status: resposta.data.status,
      qr_code: dados?.qr_code,
      qr_code_base64: dados?.qr_code_base64
    });

  } catch (erro) {

    console.error(
      "ERRO MERCADO PAGO:",
      erro.response?.data || erro.message
    );

    res.status(500).json({
      erro: "Não foi possível gerar o Pix",
      detalhes: erro.response?.data || erro.message
    });
  }
});

/* STATUS */
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

    res.json({
      status: resposta.data.status
    });

  } catch (erro) {

    console.error(
      "ERRO STATUS:",
      erro.response?.data || erro.message
    );

    res.status(500).json({
      status: "pending"
    });
  }
});

/* SERVIDOR */
app.listen(PORT, () => {
  console.log(`API Pix online na porta ${PORT}`);
});
