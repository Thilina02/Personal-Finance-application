import { Router } from "express";
import {
  listBudgetsHandler,
  createBudgetHandler,
  updateBudgetHandler,
  deleteBudgetHandler,
} from "../controllers/budgetController";
import { authMiddleware } from "../middleware/auth";

export const budgetRouter = Router();

budgetRouter.use(authMiddleware);

budgetRouter.get("/", listBudgetsHandler);
budgetRouter.post("/", createBudgetHandler);
budgetRouter.put("/:id", updateBudgetHandler);
budgetRouter.delete("/:id", deleteBudgetHandler);

