import express from "express";
import axios from "axios";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const ACCESS_TOKEN = process.env.MP_TOKEN;

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json","utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sedutin-admin-default-rtdb.firebaseio.com"
});

const db = admin.database();
let adminTokens = [];

app.post("/salvar-token",(req,res)=>{
  const { token } = req.body;
  if(token && !adminTokens.includes(token)){
    adminTokens.push(token);
  }
  res.sendStatus(200);
});

app.post("/pix", async (req,res)=>{
  const { valor, descricao, email } = req.body;
  const pagamento = await axios.post(
    "https://api.mercadopago.com/v1/payments",
    {
      transaction_amount:Number(valor),
      description:descricao,
      payment_method_id:"pix",
      payer:{ email }
    },
    {
      headers:{
        Authorization:`Bearer ${ACCESS_TOKEN}`,
        "Content-Type":"application/json"
      }
    }
  );
  res.json(pagamento.data);
});

db.ref("compras").on("child_added", snap=>{
  const c = snap.val();
  adminTokens.forEach(token=>{
    admin.messaging().send({
      token,
      notification:{
        title:"🛒 Nova compra!",
        body:`${c.nome} comprou ${c.produto}`
      }
    });
  });
});

app.listen(PORT,()=>console.log("🔥 Backend rodando"));