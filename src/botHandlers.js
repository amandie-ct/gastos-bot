import expenseService from '../src/service/expensesService.js';

class BotHandlers {
  constructor(bot) {
    this.bot = bot;
    this.userStates = new Map(); // Track user conversation states
  }

  // Add new expense
  async handleAddExpense(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
      // Parse expense data from message
      const [, amount, description, category] = match;
      
      const expenseData = {
        user_id: userId,
        amount: parseFloat(amount),
        description: description,
        category: category,
        telegram_username: msg.from.username || `${msg.from.first_name} ${msg.from.last_name}`
      };

      const expense = await expenseService.addExpense(expenseData);
      
      this.bot.sendMessage(chatId, 
        `✅ Despesa adicionada com sucesso!\n` +
        `💰 Valor: $${expense.amount}\n` +
        `📝 Descrição: ${expense.description}\n` +
        `🏷️ Categoria: ${expense.category}`
      );
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      this.bot.sendMessage(chatId, '❌ Erro ao adicionar despesa. Por favor, tente novamente.');
    }
  }

  // Get monthly summary
  async handleMonthlySummary(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const [byCategory, total] = await Promise.all([
        expenseService.getMonthlyExpensesByCategory(userId, year, month),
        expenseService.getTotalMonthlyExpenses(userId, year, month)
      ]);

      let message = `📊 Gastos do mês (${month}/${year})\n\n`;
      message += `💰 Total: $${total.toFixed(2)}\n\n`;
      message += `📈 By Category:\n`;

      Object.entries(byCategory).forEach(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        message += `• ${category}: $${amount.toFixed(2)} (${percentage}%)\n`;
      });

      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Erro ao obter resumo mensal:', error);
      this.bot.sendMessage(chatId, '❌ Erro ao obter resumo mensal.');
    }
  }

  // Edit last expense
  async handleEditLastExpense(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const lastExpense = await expenseService.getLastExpense(userId);
      
      if (!lastExpense) {
        this.bot.sendMessage(chatId, '❌ Nenhuma despesa encontrada para editar.');
        return;
      }

      // Store state for this user
      this.userStates.set(userId, {
        action: 'editing',
        expenseId: lastExpense.id
      });

      this.bot.sendMessage(chatId,
        `✏️ Editando sua última despesa:\n\n` +
        `💰 Valor: $${lastExpense.amount}\n` +
        `📝 Descrição: ${lastExpense.description}\n` +
        `🏷️ Categoria: ${lastExpense.category}\n\n` +
        `Por favor, envie suas atualizações no formato:\n` +
        `"Valor Descrição Categoria"\n\n` +
        `Exemplo: "30.00 Almoço Comida"`
      );
    } catch (error) {
      console.error('Erro ao editar despesa:', error);
      this.bot.sendMessage(chatId, '❌ Erro ao editar despesa. Por favor, tente novamente.');
    }
  }

  // Handle expense updates
  async handleExpenseUpdate(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userState = this.userStates.get(userId);

    if (!userState || userState.action !== 'editing') return;

    try {
      const [amount, description, category] = msg.text.split(' ');
      
      const updates = {
        amount: parseFloat(amount),
        description: description,
        category: category
      };

      const updatedExpense = await expenseService.editExpense(
        userState.expenseId, 
        userId, 
        updates
      );

      // Clear user state
      this.userStates.delete(userId);

      this.bot.sendMessage(chatId,
        `✅ Despesa atualizada com sucesso!\n\n` +
        `💰 Valor: $${updatedExpense.amount}\n` +
        `📝 Descrição: ${updatedExpense.description}\n` +
        `🏷️ Categoria: ${updatedExpense.category}`
      );
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      this.bot.sendMessage(chatId, '❌ Erro ao atualizar despesa. Por favor, verifique o formato.');
    }
  }

  // List recent expenses with delete options
  async handleListExpenses(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const page = parseInt(match[1]) || 1;

    try {
      const { data: expenses, total } = await expenseService.getExpenses(userId, page, 5);

      if (expenses.length === 0) {
        this.bot.sendMessage(chatId, '📭 Nenhuma despesa encontrada.');
        return;
      }

      let message = `📋 Suas Despesas (Página ${page}):\n\n`;
      
      expenses.forEach((expense, index) => {
        message += `${index + 1}. $${expense.amount} - ${expense.description} (${expense.category})\n`;
        message += `   ID: ${expense.id} | ${new Date(expense.created_at).toLocaleDateString()}\n\n`;
      });

      message += `💡 Para deletar uma despesa, use /delete <ID>`;

      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Erro ao listar despesas:', error);
      this.bot.sendMessage(chatId, '❌ Erro ao listar despesas. Por favor, tente novamente.');
    }
  }

  // Delete expense
  async handleDeleteExpense(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const expenseId = match[1];

    try {
      await expenseService.deleteExpense(expenseId, userId);
      this.bot.sendMessage(chatId, '✅ Despesa deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
      this.bot.sendMessage(chatId, '❌ Erro ao deletar despesa. Por favor, verifique o ID.');
    }
  }
}

export default BotHandlers;