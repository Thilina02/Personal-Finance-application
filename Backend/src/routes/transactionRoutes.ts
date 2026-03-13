import { Router } from "express";
import {
  listTransactionsHandler,
  createTransactionHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
} from "../controllers/transactionController";
import { authMiddleware } from "../middleware/auth";

export const transactionRouter = Router();

transactionRouter.use(authMiddleware);

transactionRouter.get("/", listTransactionsHandler);
transactionRouter.post("/", createTransactionHandler);
transactionRouter.put("/:id", updateTransactionHandler);
transactionRouter.delete("/:id", deleteTransactionHandler);

