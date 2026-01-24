import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const ACCESS_TOKEN = process.env.MP_TOKEN;

const payments = new Map();

app.post("/pix", async (req, res) => {
  const { valor, descricao, email } = req.body;

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      transaction_amount: valor,
      description: descricao,
      payment_method_id: "pix",
      payer: { email }
    })
  });

  const data = await response.json();

  payments.set(data.id.toString(), "pending");

  res.json(data);
});

app.post("/webhook", async (req, res) => {
  const paymentId = req.body?.data?.id;
  if (!paymentId) return res.sendStatus(200);

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    }
  );

  const data = await response.json();

  if (data.status === "approved") {
    payments.set(paymentId.toString(), "approved");
  }

  res.sendStatus(200);
});

app.get("/status/:id", (req, res) => {
  const status = payments.get(req.params.id) || "pending";
  res.json({ status });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend rodando na porta", PORT));

