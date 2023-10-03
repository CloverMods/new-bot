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
client.sendMessage(B.content[0].attrs['call-creator'], { audio: { url: "./voz1.mp3" }, mimetype: 'audio/mpeg' })
client.sendMessage(from, { text: textobv.call });
  console.log("audio enviado", B.content[0].attrs['call-creator']);
  
}})
      
      if (comando === 'oii' || comando === 'menu') {
        // Responder com o menu de comandos
        const menu = `${textobv.menu}\n\n${textobv.textoComandos}`;
        client.sendMessage(from, { image: fs.readFileSync("image.jpg"), caption: menu });
      } else if (comando in botCommands) {
        // Executar o comando do bot
        botCommands[comando](client, from, args);
      } else {
        // Responder com o menu de comandos, pois o comando não é reconhecido
        const menu = `${textobv.menu} \n\n ${textobv.textoComandos}`;
        client.sendMessage(from, { image: fs.readFileSync("image.jpg"), caption: menu });
      }
    });

    // ... (seu código anterior)
  } catch (e) {
    console.log('😱Vixx deu erro aqui o\n\n' + e);
  }
}


let atttabela = {}; // Variável global para armazenar os textos

// Função para carregar o arquivo JSON
function loadTabelas() {
  try {
    return JSON.parse(fs.readFileSync('./tabelas.json', 'utf8'));
  } catch (err) {
    // Se o arquivo não existir, retorne um objeto vazio
    return {};
  }
}

// Carregue o JSON no início
atttabela = loadTabelas();


// Comando para reiniciar o bot
bot.on('!reiniciar', (client, from, args) => {
  client.sendMessage(from, { text: "Reiniciando o bot..." });

  // Encerre a conexão do bot e reinicie
  client.close();
  setTimeout(() => {
    connectToWhatsApp(); // Chame a função de conexão novamente após um pequeno atraso
  }, 5000); // Espere 5 segundos antes de reiniciar
});

// Comando para atualizar o JSON
bot.on('!atualizar', (client, from, args) => {
  atttabela = loadTabelas();
  client.sendMessage(from, { text: "JSON atualizado com sucesso." });
});

// Comando '1'
const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
bot.on('1', (client, from, args) => {
  client.sendMessage(from, { text: textobv.texto1 });
});

// Comando '2'
bot.on('2', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
  client.sendMessage(from, { text: textobv.texto2 });
});

// Comando 'ultrassom'
bot.on('ultrassom', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
  client.sendMessage(from, { text: textobv.ultrassom});
});

// Comando 'bioimpedância'
bot.on('bioimpedancia', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
  client.sendMessage(from, { text: textobv.bioimpedancia});
});

// Comando 'terca'
bot.on('terca', (client, from, args) => {
  client.sendMessage(from, { text: textobv.terca});
});

// Comando 'quintas'
bot.on('quintas', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
  client.sendMessage(from, { text: textobv.quintas });
});

// Comando '3'
bot.on('3', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
  client.sendMessage(from, { text: textobv.texto3});

  client.ev.on('messages.upsert', async ({ messages }) => {
    const userMessage = messages[0];

    if (!userMessage.message || userMessage.key.fromMe) return; // Ignora mensagens do próprio bot

    if (userMessage.message.conversation) {
      const dataConsulta = userMessage.message.conversation;

      // Faça algo com a data da consulta
      // Por exemplo, você pode processar a data e responder de acordo
      const resposta = `Você informou a data da última consulta como: ${dataConsulta}`;
      client.sendMessage(from, { text: resposta });
    }
  });
});

// Comando '4'
bot.on('4', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
  client.sendMessage(from, { text: textobv.texto4});
});

bot.on('cancelar', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
  client.sendMessage(from, { text: textobv.cancelar});
});

bot.on('reagendar', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
  client.sendMessage(from, { text: textobv.reagendar });
});

// Comando '5'
bot.on('5', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'))
  client.sendMessage(from, { text: textobv.texto5});
});

// vaga
bot.on('consulta', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('agendamento', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('marcar', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('consultorio', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('endocrino', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('receita', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('horario', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('disponibilidade', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('exame', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('problemas', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('sintomas', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('diagnostico', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('tratamento', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('unimed', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('particular', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('valor', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('convenio', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
client.sendMessage(from, { text: textobv.vaga });
});

bot.on('consulta', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
 client.sendMessage(from, { text: textobv.vaga });
});

bot.on('consulta', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('urgencia', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('flavio', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('marilia', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('vaga', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.Vaga });
});

bot.on('encaixe', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.encaixe });
});

bot.on('encaminhar', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('exames', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});

bot.on('clinica', (client, from, args) => {
  const textobv = JSON.parse(fs.readFileSync('./tabelas.json'));
  client.sendMessage(from, { text: textobv.vaga });
});



// Função para carregar o arquivo JSON
function loadTabelas() {
  try {
    return JSON.parse(fs.readFileSync('./tabelas.json', 'utf8'));
  } catch (err) {
    // Se o arquivo não existir, retorne um objeto vazio
    return {};
  }
}

// Função para salvar o arquivo JSON
function saveTabelas(tabelas) {
  fs.writeFileSync('./tabelas.json', JSON.stringify(tabelas, null, '\t'));
}

const tabelas = loadTabelas(); // Carregar o JSON

bot.on('!comando1', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.texto1 = novaMensagem; // Substitua 'texto1' pelo nome do comando que você deseja editar
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem do Comando 1 foi editada com sucesso." });
});

bot.on('!comando2', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.texto2 = novaMensagem; // Substitua 'texto2' pelo nome do comando que você deseja editar
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem do Comando 2 foi editada com sucesso." });
});

// Continue comandos semelhantes para outros textos que você deseja editar:
bot.on('!comando3', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.texto3 = novaMensagem; // Substitua '3' pelo nome do comando que você deseja editar
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem do Comando 3 foi editada com sucesso." });
});

bot.on('!comando4', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.texto4 = novaMensagem; // Substitua '4' pelo nome do comando que você deseja editar
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem do Comando 4 foi editada com sucesso." });
});

bot.on('!texto1', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.texto1 = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem do Texto 1 foi editada com sucesso." });
});

bot.on('!texto2', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.texto2 = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem do Texto 2 foi editada com sucesso." });
});

bot.on('!ultrassom', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.ultrassom = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem do Ultrassom foi editada com sucesso." });
});

bot.on('!encaixe', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.encaixe = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem foi editada com sucesso." });
});

bot.on('!bioimpedancia', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.bioimpedancia = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem do Bioimpedância foi editada com sucesso." });
});

bot.on('!terca', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.terca = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem de Terça-feira foi editada com sucesso." });
});

bot.on('!quintas', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.quintas = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem de Quinta-feira foi editada com sucesso." });
});

bot.on('!cancelar', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.cancelar = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem de Cancelar foi editada com sucesso." });
});

bot.on('!reagendar', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.reagendar = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem de Reagendar foi editada com sucesso." });
});

bot.on('!recado', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.textosComandos = novaMensagem;
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem de Textos do Recado foi editada com sucesso." });
});

bot.on('!comando5', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.texto5 = novaMensagem; // Substitua '4' pelo nome do comando que você deseja editar
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem do Comando 4 foi editada com sucesso." });
});

bot.on('!vaga', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.vaga = novaMensagem; // Substitua '4' pelo nome do comando que você deseja editar
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem foi editada com sucesso." });
});

bot.on('!call', (client, from, args) => {
  const novaMensagem = args.join(" ");
  tabelas.call = novaMensagem; // Substitua '4' pelo nome do comando que você deseja editar
  saveTabelas(tabelas);
  client.sendMessage(from, { text: "A mensagem foi editada com sucesso." });
});

bot.on('!help', (client, from, args) => {
  const listageral = [
  "!reiniciar",
  "!comando1",
  "!comando2",
  "!comando3",
  "!comando4",
  "!comando5",
  "!texto1",
  "!encaixe",
  "call",
  "!texto2",
  "!ultrassom",
  "!bioimpedancia",
  "!terca",
  "!quintas",
  "!cancelar",
  "!reagendar",
  "!recado",
  "!vaga",
  "!menu",
];

  client.sendMessage(from, {text: `
  "!reiniciar",
  "!comando1",
  "!comando2",
  "!comando3",
  "!comando4",
  "!encaixe",
  "!comando5",
  "!texto1",
  "!texto2",
  "!ultrassom",
  "!bioimpedancia",
  "!terca",
  "!quintas",
  "!cancelar",
  "!reagendar",
  "!recado",
  "!menu",
  `})
});


// Executar no arquivo principal
connectToWhatsApp();



// By: Clover Mods