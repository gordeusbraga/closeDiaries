const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const path = require("path");
const axios = require("axios");

// Função para extrair o ID da planilha a partir da URL
function extrairIdDaPlanilha(url) {
  const regex = /spreadsheets\/d\/([^\/]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1]; // Retorna o ID encontrado
  } else {
    throw new Error("ID da planilha não encontrado na URL.");
  }
}

// Função para gerar o PDF em buffer
async function gerarPDFDaPlanilha(url) {
  try {
    const spreadsheetId = extrairIdDaPlanilha(url);

    // URL para exportar a planilha em PDF
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?`;
    const params = new URLSearchParams({
      format: "pdf",
      size: "A4",
      portrait: "false",
      gridlines: "false",
      sheetnames: "true",
      printtitle: "true",
      pagenum: "CENTER",
    });

    const pdfUrl = `${exportUrl}${params.toString()}`;

    // Faz a requisição para obter o PDF
    const response = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
    });

    return response.data; // Retorna o buffer do PDF
  } catch (error) {
    console.error("Erro ao gerar o PDF:", error.message);
    throw error;
  }
}

// Configuração do cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.resolve("./session"),
  }),
});

let useroption = {};

client.on("ready", () => {
  console.log("Bot iniciado e pronto para uso!");

  client.on("message", async (message) => {
    const chat = await message.getChat();
    const userId = message.from;

    if (message.body !== "" && !chat.isGroup) {
      if (!useroption[userId]) {
        message.reply(
          "👾 Bem-vindo! Escolha uma opção:\n\n1 - Gerar PDF da planilha"
        );
        useroption[userId] = "main_menu";
      }

      handleUserInput(userId, message);
    }
  });

  async function handleUserInput(userId, message) {
    if (useroption[userId] === "main_menu") {
      if (message.body === "1") {
        message.reply("Por favor, envie o link da planilha.");
        useroption[userId] = "awaiting_url";
      }
    } else if (useroption[userId] === "awaiting_url") {
      const urlDaPlanilha = message.body;

      try {
        message.reply("Gerando o PDF, por favor, aguarde...");

        // Gera o PDF como buffer
        const pdfBuffer = await gerarPDFDaPlanilha(urlDaPlanilha);

        // Cria o objeto MessageMedia
        const media = new MessageMedia(
          "application/pdf",
          pdfBuffer.toString("base64"),
          `planilha.pdf`
        );

        // Envia o PDF para o usuário
        await client.sendMessage(userId, media);

        message.reply("Aqui está o PDF da planilha! 📄");
        useroption[userId] = "main_menu";
        message.reply(
          "👾 Bem-vindo! Escolha uma opção:\n\n1 - Gerar PDF da planilha"
        );
      } catch (error) {
        message.reply(
          "Houve um erro ao gerar o PDF. Verifique o link enviado e tente novamente."
        );
        console.error(error);
        useroption[userId] = "main_menu";
        message.reply(
          "👾 Bem-vindo! Escolha uma opção:\n\n1 - Gerar PDF da planilha"
        );
      }
    }
  }
});

// Gerando QR Code
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("auth_failure", (msg) => {
  console.error("Falha na autenticação:", msg);
});

client.on("disconnected", (reason) => {
  console.log("Bot desconectado:", reason);
});

client.initialize();
