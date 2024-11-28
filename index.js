const axios = require("axios");
const fs = require("fs");

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

async function gerarPDFDaPlanilha(url) {
  try {
    const spreadsheetId = extrairIdDaPlanilha(url); // Extrai o ID da URL da planilha

    // URL para exportar a planilha em PDF
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?`;

    // Parâmetros para configurar o PDF
    const params = new URLSearchParams({
      format: "pdf", // Formato PDF
      size: "A4", // Tamanho do papel (ajuste conforme necessário)
      portrait: "false", // Paisagem
      gridlines: "false", // Sem linhas de grade
      sheetnames: "true", // Incluir nomes das abas no PDF
      printtitle: "true", // Mostrar cabeçalhos de título
      pagenum: "CENTER", // Números de páginas no centro
    });

    const pdfUrl = `${exportUrl}${params.toString()}`;

    // Faz a requisição para obter o PDF
    const response = await axios.get(pdfUrl, {
      responseType: "arraybuffer", // Importante para garantir que o arquivo seja binário
    });

    // Salva o conteúdo do PDF no disco
    const pdfFilename = `planilha_${spreadsheetId}.pdf`; // Salva com nome baseado no ID da planilha
    fs.writeFileSync(pdfFilename, response.data);
    console.log(`PDF gerado com sucesso: ${pdfFilename}`);
    return pdfFilename; // Retorna o caminho do arquivo gerado
  } catch (error) {
    console.error("Erro ao gerar PDF da planilha:", error);
    throw error; // Lançar erro para ser tratado na função que chama
  }
}

module.exports = gerarPDFDaPlanilha;
