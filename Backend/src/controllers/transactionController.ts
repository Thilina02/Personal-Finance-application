import { Response } from "express";
import { z } from "zod";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactionService";
import { AuthRequest } from "../middleware/auth";

const transactionSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  categoryId: z.number().int().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string(),
  note: z.string().optional(),
});

export async function listTransactionsHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, categoryId, type } = req.query;

    const filters: any = {};
    if (typeof startDate === "string") filters.startDate = startDate;
    if (typeof endDate === "string") filters.endDate = endDate;
    if (typeof categoryId === "string") filters.categoryId = Number(categoryId);
    if (typeof type === "string" && (type === "INCOME" || type === "EXPENSE")) {
      filters.type = type;
    }

    const transactions = await listTransactions(userId, filters);
    return res.json(transactions);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createTransactionHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const parsed = transactionSchema.parse(req.body);
    const created = await createTransaction(userId, parsed);
    return res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateTransactionHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }
    const parsed = transactionSchema.parse(req.body);
    await updateTransaction(userId, id, parsed);
    return res.status(204).send();
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTransactionHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }
    await deleteTransaction(userId, id);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

