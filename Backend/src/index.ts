import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRouter } from "./routes/authRoutes";
import { categoryRouter } from "./routes/categoryRoutes";
import { transactionRouter } from "./routes/transactionRoutes";
import { budgetRouter } from "./routes/budgetRoutes";
import { dashboardRouter } from "./routes/dashboardRoutes";
import { initDb, pool } from "./db/pool";
import { runMigrations } from "./db/migrate";

async function assertDbConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ Connected to MySQL");
  } catch (err) {
    console.error("❌ Failed to connect to MySQL", err);
    process.exit(1);
  }
}

async function main() {
  await initDb();
  await assertDbConnection();
  await runMigrations(); // ← creates tables if they don't exist

  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: false,
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/transactions", transactionRouter);
  app.use("/api/budgets", budgetRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  app.listen(env.port, () => {
    console.log(`🚀 API server listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});