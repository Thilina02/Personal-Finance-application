import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db/pool";

export interface Budget extends RowDataPacket {
  id: number;
  category_id: number;
  category_name: string;
  amount: number;
  start_date: string;
  end_date: string;
}

export async function listBudgets(userId: number) {
  const [rows] = await pool.execute<Budget[]>(
    `
    SELECT 
      b.id,
      b.category_id,
      c.name AS category_name,
      b.amount,
      b.start_date,
      b.end_date
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    WHERE b.user_id = ?
    ORDER BY b.start_date DESC
    `,
    [userId]
  );
  return rows;
}

export async function createBudget(
  userId: number,
  input: { categoryId: number; amount: number; startDate: string; endDate: string }
) {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date)
    VALUES (?, ?, ?, 'MONTHLY', ?, ?)
    `,
    [userId, input.categoryId, input.amount, input.startDate, input.endDate]
  );
  return { id: result.insertId, ...input };
}

export async function updateBudget(
  userId: number,
  id: number,
  input: { categoryId: number; amount: number; startDate: string; endDate: string }
) {
  await pool.execute<ResultSetHeader>(
    `
    UPDATE budgets
    SET category_id = ?, amount = ?, start_date = ?, end_date = ?
    WHERE id = ? AND user_id = ?
    `,
    [input.categoryId, input.amount, input.startDate, input.endDate, id, userId]
  );
}

export async function deleteBudget(userId: number, id: number) {
  await pool.execute<ResultSetHeader>(
    "DELETE FROM budgets WHERE id = ? AND user_id = ?",
    [id, userId]
  );
}

