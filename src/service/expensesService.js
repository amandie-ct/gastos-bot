import { supabase } from '../supabaseClient.js';

class ExpenseService {
  // Add new expense
  async addExpense(expenseData) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Get monthly expenses by category for a user
  async getMonthlyExpensesByCategory(userId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    // Group by category and sum amounts
    const expensesByCategory = data.reduce((acc, expense) => {
      const { category, amount } = expense;
      acc[category] = (acc[category] || 0) + parseFloat(amount);
      return acc;
    }, {});

    return expensesByCategory;
  }

  // Get total monthly expenses
  async getTotalMonthlyExpenses(userId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const total = data.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    return total;
  }

  // Get last N expenses for a user
  async getLastExpenses(userId, limit = 10) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Get last expense for a user
  async getLastExpense(userId) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data[0] || null;
  }

  // Edit expense
  async editExpense(expenseId, userId, updates) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Delete expense
  async deleteExpense(expenseId, userId) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  // Get expenses with pagination
  async getExpenses(userId, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, total: count };
  }
}

export default new ExpenseService();