import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildAdded } from "firebase/database";
import axios from "axios";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC1eMj89GRXjYQkGmCK619yyC18LkXmvIk",
  authDomain: "sedutin-admin.firebaseapp.com",
  databaseURL: "https://sedutin-admin-default-rtdb.firebaseio.com",
  projectId: "sedutin-admin",
  storageBucket: "sedutin-admin.appspot.com",
  messagingSenderId: "894619222649",
  appId: "1:894619222649:web:a25695bce414805e2e8aa8"
};

// Inicializa o Firebase
const appFirebase = initializeApp(firebaseConfig);
const db = getDatabase(appFirebase);

// Configuração do Telegram
const TELEGRAM_TOKEN = 'seu_token_do_bot_aqui'; // Coloque o token do seu bot do Telegram
const TELEGRAM_CHAT_ID = 'seu_chat_id_aqui';   // Coloque o seu Chat ID do Telegram

// Função para enviar mensagem para o Telegram
async function enviarTelegram(mensagem) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: mensagem,
      parse_mode: "HTML"
    });
    console.log("Mensagem enviada para o Telegram!");
  } catch (err) {
    console.error("Erro ao enviar mensagem para o Telegram:", err);
  }
}

// Monitorando a referência "compras" no Firebase
const comprasRef = ref(db, 'compras');

// Função para monitorar novas compras
onChildAdded(comprasRef, (snapshot) => {
  const compra = snapshot.val();
  console.log("Nova compra detectada:", compra);

  if (compra) {
    const mensagem = `
    *Nova Compra* 🛒
    📝 Produto: ${compra.produto}
    👤 Nome: ${compra.nome}
    📞 WhatsApp: ${compra.whatsapp}
    🎮 ID FF: ${compra.freefireId || 'Não informado'}
    💲 Valor: R$ ${compra.valor.toFixed(2).replace('.', ',')}
    🕒 Data: ${new Date(compra.data).toLocaleString('pt-BR')}
    `;
    
    // Envia a mensagem para o Telegram
    enviarTelegram(mensagem);
  }
});

console.log("Monitorando compras no Firebase...");