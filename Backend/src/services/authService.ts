import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../db/pool";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const hashed = await hashPassword(input.password);

  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [input.name, input.email, hashed]
  );

  return { id: result.insertId, name: input.name, email: input.email };
}

export async function loginUser(input: {
  email: string;
  password: string;
}) {
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT * FROM users WHERE email = ?",
    [input.email]
  );

  const user = rows[0];
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const match = await comparePassword(input.password, user.password_hash);
  if (!match) {
    throw new Error("Invalid credentials");
  }

  const token = signToken({ userId: user.id });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

