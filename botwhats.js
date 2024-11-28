const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const path = require("path");
const gerarPDFDaPlanilha = require("./index.js"); // Importa a função que gera o PDF

// Iniciando o Cliente e mantendo o Login
console.log("Iniciando...");
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.resolve("session"),
  }),
});

let userLastInteraction = {};
const INACTIVITY_PERIOD = 15 * 60 * 1000; // 15 minutos
let useroption = {};
let userState = {}; // Armazena o estado atual do usuário

client.on("ready", async () => {
  console.log("Bot iniciado!");

  client.on("message", async (message) => {
    const chat = await message.getChat();
    const userId = message.from;
    const now = new Date().getTime();

    // Resposta de boas-vindas e menu
    if (message.body !== "" && !chat.isGroup) {
      if (
        !userLastInteraction[userId] ||
        now - userLastInteraction[userId] > INACTIVITY_PERIOD
      ) {
        message.reply(
          "👾 Sejam bem-vindos! 👾\n\nEscolha a opção desejada:\n\n1 - Fechamento de Planilha"
        );
        useroption[userId] = "main_menu";
      }

      userLastInteraction[userId] = now;
      options(userId, message);
    }
  });

  // Função que gerencia as opções do usuário
  async function options(userId, message) {
    if (useroption[userId] === "main_menu") {
      if (message.body === "1") {
        message.reply("Envie o link da planilha para gerar o PDF.");
        useroption[userId] = "planilha";
      } else {
        message.reply("Opção inválida! Tente novamente.");
      }
    } else if (useroption[userId] === "planilha") {
      const urlDaPlanilha = message.body;
      try {
        // Gera o PDF da planilha e envia o arquivo
        const pdfFilePath = await gerarPDFDaPlanilha(urlDaPlanilha);
        message.reply(`Aqui está o PDF da sua planilha:`, {
          mediaUrl: pdfFilePath,
        });
        useroption[userId] = "main_menu";
      } catch (error) {
        message.reply(
          "Ocorreu um erro ao gerar o PDF da planilha. Tente novamente."
        );
      }
    }
  }
});

// Gerando QR Code
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.initialize();
