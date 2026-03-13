import { Router } from "express";
import { dashboardHandler } from "../controllers/dashboardController";
import { authMiddleware } from "../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

dashboardRouter.get("/", dashboardHandler);

