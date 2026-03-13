import { Router } from "express";
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from "../controllers/categoryController";
import { authMiddleware } from "../middleware/auth";

export const categoryRouter = Router();

categoryRouter.use(authMiddleware);

categoryRouter.get("/", listCategoriesHandler);
categoryRouter.post("/", createCategoryHandler);
categoryRouter.put("/:id", updateCategoryHandler);
categoryRouter.delete("/:id", deleteCategoryHandler);

