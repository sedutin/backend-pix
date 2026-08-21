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

/* CRIAR PIX */
app.post("/pix", async (req, res) => {
  try {
    const { valor, descricao, email } = req.body;

    const valorNumerico = Number(valor);

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0 ||
      !email
    ) {
      return res.status(400).json({
        erro: "Valor ou e-mail inválido"
      });
    }

    if (!ACCESS_TOKEN) {
      return res.status(500).json({
        erro: "MP_TOKEN não configurado no servidor"
      });
    }

    const pagamento = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: valorNumerico,
        description: descricao || "Pagamento Pix",
        payment_method_id: "pix",
        payer: {
          email
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `pix-${Date.now()}`
        }
      }
    );

    const pix =
      pagamento.data.point_of_interaction
        ?.transaction_data;

    res.json({
      id: pagamento.data.id,
      status: pagamento.data.status,
      qr_code: pix?.qr_code,
      qr_code_base64: pix?.qr_code_base64,
      ticket_url: pix?.ticket_url
    });

  } catch (err) {
    console.error(
      "ERRO PIX:",
      err.response?.data || err.message
    );

    res.status(500).json({
      erro: "Erro ao gerar Pix",
      detalhes: err.response?.data || null
    });
  }
});

/* CONSULTAR STATUS */
app.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resposta = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json({
      status: resposta.data.status
    });

  } catch (err) {
    console.error(
      "ERRO STATUS:",
      err.response?.data || err.message
    );

    res.status(500).json({
      status: "pending"
    });
  }
});

/* START */
app.listen(PORT, () => {
  console.log(
    `SEDUTIN VENDAS - API Pix rodando na porta ${PORT}`
  );
});
