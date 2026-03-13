import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db/pool";

export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction extends RowDataPacket {
  id: number;
  title: string;
  amount: number;
  category_id: number;
  category_name: string;
  type: TransactionType;
  date: string;
  note: string | null;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  type?: TransactionType;
}

export async function listTransactions(
  userId: number,
  filters: TransactionFilters
) {
  const conditions: string[] = ["t.user_id = ?"];
  const params: (string | number)[] = [userId];

  if (filters.startDate) {
    conditions.push("t.date >= ?");
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push("t.date <= ?");
    params.push(filters.endDate);
  }
  if (filters.categoryId) {
    conditions.push("t.category_id = ?");
    params.push(filters.categoryId);
  }
  if (filters.type) {
    conditions.push("t.type = ?");
    params.push(filters.type);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.execute<Transaction[]>(
    `
    SELECT 
      t.id,
      t.title,
      t.amount,
      t.category_id,
      c.name AS category_name,
      t.type,
      t.date,
      t.note
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    ${whereClause}
    ORDER BY t.date DESC, t.created_at DESC
    `,
    params
  );

  return rows;
}

export async function createTransaction(
  userId: number,
  input: {
    title: string;
    amount: number;
    categoryId: number;
    type: TransactionType;
    date: string;
    note?: string;
  }
) {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO transactions
      (user_id, category_id, title, amount, type, date, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      input.categoryId,
      input.title,
      input.amount,
      input.type,
      input.date,
      input.note || null,
    ]
  );

  return { id: result.insertId, ...input };
}

export async function updateTransaction(
  userId: number,
  id: number,
  input: {
    title: string;
    amount: number;
    categoryId: number;
    type: TransactionType;
    date: string;
    note?: string;
  }
) {
  await pool.execute<ResultSetHeader>(
    `
    UPDATE transactions
    SET title = ?, amount = ?, category_id = ?, type = ?, date = ?, note = ?
    WHERE id = ? AND user_id = ?
    `,
    [
      input.title,
      input.amount,
      input.categoryId,
      input.type,
      input.date,
      input.note || null,
      id,
      userId,
    ]
  );
}

export async function deleteTransaction(userId: number, id: number) {
  await pool.execute<ResultSetHeader>(
    "DELETE FROM transactions WHERE id = ? AND user_id = ?",
    [id, userId]
  );
}

