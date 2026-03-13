import { Response } from "express";
import { z } from "zod";
import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../services/budgetService";
import { AuthRequest } from "../middleware/auth";

const budgetSchema = z.object({
  categoryId: z.number().int().positive(),
  amount: z.number().positive(),
  startDate: z.string(),
  endDate: z.string(),
});

export async function listBudgetsHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const budgets = await listBudgets(userId);
    return res.json(budgets);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createBudgetHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const body = budgetSchema.parse(req.body);
    const budget = await createBudget(userId, body);
    return res.status(201).json(budget);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBudgetHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid budget id" });
    }
    const body = budgetSchema.parse(req.body);
    await updateBudget(userId, id, body);
    return res.status(204).send();
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBudgetHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid budget id" });
    }
    await deleteBudget(userId, id);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

