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

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Defina o token do Telegram e o chat ID
const TELEGRAM_TOKEN = '8321916744:AAEdSuWLhrS0kkAKgxjI2_GqtnoSaETzENY';  // Substitua com o seu token do Telegram
const CHAT_ID = '8321599291';      // Substitua com o seu chat ID do Telegram

// Função para enviar mensagem para o Telegram
async function enviarMensagemTelegram(mensagem) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const params = {
      chat_id: CHAT_ID,
      text: mensagem
    };
    await axios.post(url, params);
    console.log("Mensagem enviada para o Telegram!");
  } catch (error) {
    console.error("Erro ao enviar mensagem para o Telegram:", error);
  }
}

// Monitorando a referência "compras" no Firebase
const comprasRef = ref(db, 'compras');

// Função para monitorar novas compras
onChildAdded(comprasRef, (snapshot) => {
  const compra = snapshot.val();
  console.log("Nova compra detectada:", compra);

  if (compra) {
    // Formatação da mensagem para o Telegram
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
    enviarMensagemTelegram(mensagem);
  }
});

console.log("Monitorando compras...");