const { makeWASocket, useMultiFileAuthState, makeInMemoryStore, DisconnectReason, MessageRetryMap } = require('@whiskeysockets/baileys');
const P = require("pino");
const fs = require("fs");

const botCommands = {};
const textosComandos = {};

const bot = {
  on: (command, callback) => {
    botCommands[command] = callback;
  },
};

async function connectToWhatsApp() {
  try {
    const store = makeInMemoryStore({
      logger: P().child({
        level: 'debug',
        stream: 'store'
      })
    });

    // NOME DO ARQUIVO DO CÓDIGO QR
    const { state, saveCreds } = await useMultiFileAuthState('./arquivo-qr');

    const client = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: true,
      auth: state,
      msgRetryCounterMap: MessageRetryMap,
      defaultQueryTimeoutMs: undefined,
      patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(message.buttonsMessage || message.listMessage);
        if (requiresPatch) {
          message = {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadataVersion: 2,
                  deviceListMetadata: {},
                },
                ...message
              }
            }
          };
        }
        return message;
      }
    });

    console.log('\033[1;32m online\x1b[1;37m');
    store.bind(client.ev);

    client.ev.on("creds.update", saveCreds);
    store.bind(client.ev);

    client.ev.on("chats.set", () => {
      console.log("Tem conversas", store.chats.all());
    });

    client.ev.on("contacts.set", () => {
      console.log("Tem contatos", Object.values(store.contacts));
    });

    client.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log("Conexão fechada devido a", lastDisconnect.error, "Tentando reconectar...", shouldReconnect);
        if (shouldReconnect) {
          connectToWhatsApp();
        }
      } else if (connection === "open") {
        console.log("Conectado com sucesso!");
      }
    });





    
    client.ev.on('messages.upsert', async ({ messages }) => {
      const m = messages[0];
      if (!m.message || m.key.fromMe) return; // Ignora mensagens do próprio bot
      
      const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))

      const messageType = Object.keys(m.message)[0];
      const info = m;
      const altpdf = Object.keys(info.message)
      const content = m.message[messageType];
      const from = m.key.remoteJid;

      if (!m.message) return;
      const type = altpdf[0] == 'senderKeyDistributionMessage' ? altpdf[1] == 'messageContextInfo' ? altpdf[2] : altpdf[1] : altpdf[0]
      var body = (type === 'conversation') ?
        info.message.conversation : (type == 'imageMessage') ?
        info.message.imageMessage.caption : (type == 'videoMessage') ?
        info.message.videoMessage.caption : (type == 'extendedTextMessage') ?
        info.message.extendedTextMessage.text : (type == 'buttonsResponseMessage') ?
        info.message.buttonsResponseMessage.selectedButtonId : (type == 'listResponseMessage') ?
        info.message.listResponseMessage.singleSelectReply.selectedRowId : (type == 'templateButtonReplyMessage') ?
        info.message.templateButtonReplyMessage.selectedId : ''
      const args = body.trim().split(/ +/).slice(1)
      const comando = body.slice().trim().split(/ +/).shift().toLowerCase();
      const isCmd = comando !== null && comando !== undefined;
      const q = args.join(" ")

      //  sistema de chamadas 
      
client.ws.on('CB:call', async (B) => {
if (B.content[0].tag == 'offer') {
// 
  
}})
      
      if (comando === 'oii' || comando === 'menu') {
        // Responder com o menu de comandos
       
      } else if (comando in botCommands) {
        // Executar o comando do bot
        botCommands[comando](client, from, args);
      } else {
        // Responder com o menu de comandos, pois o comando não é reconhecido
       
      }
    });

    // ... (seu código anterior)
  } catch (e) {
    console.log('😱Vixx deu erro aqui o\n\n' + e);
  }
}

// Executar no arquivo principal
connectToWhatsApp();



// By: Clover Mods
