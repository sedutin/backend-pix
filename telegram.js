import axios from "axios";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function notificarTelegram(dados) {
  try {
    const mensagem = `
💰 *PIX APROVADO*

📦 Produto: ${dados.produto}
👤 Nome: ${dados.nome}
📞 WhatsApp: ${dados.whatsapp}
🎮 ID FF: ${dados.freefireId || "BR MOD"}
💵 Valor: R$ ${dados.valor.toFixed(2).replace(".", ",")}
🕒 Data: ${new Date(dados.data).toLocaleString("pt-BR")}
    `;

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem,
        parse_mode: "Markdown"
      }
    );
  } catch (err) {
    console.error("❌ Erro Telegram:", err.message);
  }
}