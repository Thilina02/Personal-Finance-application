import mysql, { Pool } from "mysql2/promise";
import { env } from "../config/env";

let _pool: Pool | null = null;

function assertSafeDbIdentifier(name: string) {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(
      `Invalid DB_NAME "${name}". Use only letters, numbers, and underscore.`
    );
  }
}

export function getPool(): Pool {
  if (!_pool) {
    throw new Error("Database pool has not been initialized. Call initDb() first.");
  }
  return _pool;
}

export async function initDb() {
  if (_pool) return;

  assertSafeDbIdentifier(env.db.database);

  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: false,
  });

  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await conn.end();
  }

  _pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

// Keep backward-compat export — but now it's a Proxy so it's never undefined
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return getPool()[prop as keyof Pool];
  },
});