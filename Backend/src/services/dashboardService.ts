import { RowDataPacket } from "mysql2";
import { pool } from "../db/pool";

interface SummaryRow extends RowDataPacket {
  total_income: number | null;
  total_expense: number | null;
}

interface CategoryDistributionRow extends RowDataPacket {
  category_name: string;
  total: number;
}

interface MonthlyRow extends RowDataPacket {
  month: string;
  income: number | null;
  expense: number | null;
}

interface BudgetUsageRow extends RowDataPacket {
  budget_id: number;
  category_name: string;
  budget_amount: number;
  spent: number | null;
}

export async function getDashboardData(userId: number) {
  const [summaryRows] = await pool.execute<SummaryRow[]>(
    `
    SELECT
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS total_expense
    FROM transactions
    WHERE user_id = ?
    `,
    [userId]
  );

  const summary = summaryRows[0];
  const totalIncome = summary?.total_income ?? 0;
  const totalExpense = summary?.total_expense ?? 0;

  const [categoryRows] = await pool.execute<CategoryDistributionRow[]>(
    `
    SELECT c.name AS category_name, SUM(t.amount) AS total
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = ? AND t.type = 'EXPENSE'
    GROUP BY c.name
    ORDER BY total DESC
    `,
    [userId]
  );

  const [monthlyRows] = await pool.execute<MonthlyRow[]>(
    `
    SELECT 
      DATE_FORMAT(date, '%Y-%m') AS month,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS expense
    FROM transactions
    WHERE user_id = ?
    GROUP BY DATE_FORMAT(date, '%Y-%m')
    ORDER BY month
    `,
    [userId]
  );

  const [budgetRows] = await pool.execute<BudgetUsageRow[]>(
    `
    SELECT 
      b.id AS budget_id,
      c.name AS category_name,
      b.amount AS budget_amount,
      SUM(t.amount) AS spent
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN transactions t
      ON t.category_id = b.category_id
      AND t.user_id = b.user_id
      AND t.type = 'EXPENSE'
      AND t.date BETWEEN b.start_date AND b.end_date
    WHERE b.user_id = ?
    GROUP BY b.id, c.name, b.amount
    `,
    [userId]
  );

  return {
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    },
    expenseByCategory: categoryRows,
    monthlyIncomeVsExpenses: monthlyRows,
    budgetUsage: budgetRows.map((b) => ({
      budgetId: b.budget_id,
      categoryName: b.category_name,
      budgetAmount: b.budget_amount,
      spent: b.spent ?? 0,
      usage: b.budget_amount
        ? Math.min(100, Math.round(((b.spent ?? 0) / b.budget_amount) * 100))
        : 0,
    })),
  };
}

