import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db/pool";

export type CategoryType = "INCOME" | "EXPENSE";

export interface Category extends RowDataPacket {
  id: number;
  name: string;
  type: CategoryType;
}

export async function listCategories(userId: number) {
  const [rows] = await pool.execute<Category[]>(
    "SELECT id, name, type FROM categories WHERE user_id = ? ORDER BY name",
    [userId]
  );
  return rows;
}

export async function createCategory(userId: number, input: { name: string; type: CategoryType }) {
  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)",
    [userId, input.name, input.type]
  );
  return { id: result.insertId, ...input };
}

export async function updateCategory(
  userId: number,
  id: number,
  input: { name: string; type: CategoryType }
) {
  await pool.execute<ResultSetHeader>(
    "UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?",
    [input.name, input.type, id, userId]
  );
}

export async function deleteCategory(userId: number, id: number) {
  // Prevent deleting categories that are still referenced by transactions.
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM transactions WHERE user_id = ? AND category_id = ?",
    [userId, id]
  );
  const count = Number((rows[0] as any)?.cnt ?? 0);
  if (count > 0) {
    const err: any = new Error(
      "Cannot delete category with existing transactions"
    );
    err.code = "CATEGORY_IN_USE";
    throw err;
  }

  await pool.execute<ResultSetHeader>(
    "DELETE FROM categories WHERE id = ? AND user_id = ?",
    [id, userId]
  );
}

