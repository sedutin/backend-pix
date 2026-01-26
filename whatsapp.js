import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";

let sock;

export async function iniciarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) iniciarWhatsApp();
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado");
    }
  });
}

export async function enviarMensagem(numero, mensagem) {
  if (!sock) throw new Error("WhatsApp não conectado");

  const jid = numero.replace(/\D/g, "") + "@s.whatsapp.net";
  await sock.sendMessage(jid, { text: mensagem });
}
