export const addExpense = async ({user_id, date, description, category, amount}) => {
    const {data: inserted, error} = await supabase.from('gastos').insert([{user_id, date, description, category, amount}]).select();
    if (error) throw error;
    return inserted;
};