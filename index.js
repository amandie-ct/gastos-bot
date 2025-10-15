import TelegramBot from "node-telegram-bot-api";
import { google } from "googleapis";
import dotenv from "dotenv";
import moment from "moment";

// Carrega variáveis do .env
dotenv.config();

// === 1️⃣ Inicializa o bot ===
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// === 2️⃣ Autenticação com Google Sheets ===
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json", // credenciais baixadas do Google Cloud
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// === 3️⃣ Configurações ===
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = "gastos1"; // ajuste conforme o nome da sua aba no Sheets

// === 4️⃣ Função auxiliar para registrar gasto ===
async function adicionarGasto(valor, descricao, categoria, usuario) {
  const data = moment().format("YYYY-MM-DD");

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:E`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[data, descricao, valor, categoria, usuario]],
    },
  });
}

// === 5️⃣ Função para gerar relatório ===

async function gerarRelatorio(usuario) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:E`,
  });

  const linhas = res.data.values || [];
  if (linhas.length < 2) return "Nenhum gasto registrado ainda.";

  const mesAtual = moment().format("YYYY-MM");
  const gastosDoMes = linhas.filter(
    (linha) =>
      linha[0]?.startsWith(mesAtual) && linha[4] === usuario
  );

  if (gastosDoMes.length === 0)
    return "Nenhum gasto encontrado neste mês.";

  const porCategoria = {};
  let total = 0;

  for (const linha of gastosDoMes) {
    const valor = parseFloat(linha[2]) || 0;
    const categoria = linha[3] || "Outros";
    porCategoria[categoria] = (porCategoria[categoria] || 0) + valor;
    total += valor;
  }

  let resposta = `💰 *Gastos de ${moment().format("MMMM/YYYY")}*\n\n`;
  for (const cat in porCategoria) {
    resposta += `• ${cat}: $${porCategoria[cat].toFixed(2)}\n`;
  }
  resposta += `\n🧾 Total: *$${total.toFixed(2)}*`;

  return resposta;
}

// === 6️⃣ Reage a mensagens ===
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  // /start → mensagem de boas-vindas
  if (msg.text === "/start") {
    bot.sendMessage(
      chatId,
      "👋 Olá! Me envie seus gastos no formato:\n\n`35 almoço alimentação`\n\nUse /report para ver o total do mês.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  // /report → relatório mensal
  if (msg.text === "/report") {
    const resposta = await gerarRelatorio(username);
    bot.sendMessage(chatId, resposta, { parse_mode: "Markdown" });
    return;
  }

  // Tenta interpretar mensagens de gasto
  const partes = msg.text.trim().split(" ");
  const valor = parseFloat(partes[0]);
  const descricao = partes[1];
  const categoria = partes[2];

  if (!valor || !descricao || !categoria) {
    bot.sendMessage(
      chatId,
      "⚠️ Formato inválido! Use: `valor descrição categoria`\nEx: `35 almoço alimentação`",
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Adiciona no Google Sheets
  try {
    await adicionarGasto(valor, descricao, categoria, username);
    bot.sendMessage(
      chatId,
      `✅ Gasto adicionado!\n💵 ${valor} - ${descricao} (${categoria})`
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Erro ao registrar gasto.");
  }
});