import TelegramBot from 'node-telegram-bot-api';
import BotHandlers from './src/botHandlers.js';

import { config } from 'dotenv';

config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { 
  polling: true 
});

const handlers = new BotHandlers(bot);

bot.onText(/\/add (.+) (.+) (.+)/, (msg, match) => {
  handlers.handleAddExpense(msg, match);
});

bot.onText(/\/report/, (msg, match) => {
  handlers.handleMonthlySummary(msg, match);
});

bot.onText(/\/editlast/, (msg) => {
  handlers.handleEditLastExpense(msg);
});


bot.onText(/\/list(?: (\d+))?/, (msg, match) => {
  handlers.handleListExpenses(msg, match);
});

bot.onText(/\/delete (.+)/, (msg, match) => {
  handlers.handleDeleteExpense(msg, match);
});

// Start command
bot.onText(/\/start/, (msg) => {
    handlers.handleStartCommand(msg);
  });

// Help command
bot.onText(/\/help/, (msg) => {
  const helpMessage = `
💼 Comandos do GastosBot:

💰 Adicionar despesa:
/add <valor> <descrição> <categoria>
Exemplo: /add 25.50 Almoço Comida

📊 Listar gastos mensais:
/report - Resumo mensal por categoria

✏️ Editar despesas:
/editlast - Edita sua última despesa
/list - List despesas recentes
/list <page> - Lista despesas recentes por página

🗑️ Delete Expenses:
/delete <id_da_despesa> - Exclui despesa específica
  `;
  bot.sendMessage(msg.chat.id, helpMessage);
});

// Handle text messages for editing (non-command messages)
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    handlers.handleExpenseUpdate(msg);
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error);
});

console.log('🤖 GastosBot is running...');