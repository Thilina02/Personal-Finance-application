import { Response } from "express";
import { z } from "zod";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryService";
import { AuthRequest } from "../middleware/auth";

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export async function listCategoriesHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const categories = await listCategories(userId);
    return res.json(categories);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createCategoryHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const body = categorySchema.parse(req.body);
    const category = await createCategory(userId, body);
    return res.status(201).json(category);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateCategoryHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }
    const body = categorySchema.parse(req.body);
    await updateCategory(userId, id, body);
    return res.status(204).send();
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteCategoryHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }
    await deleteCategory(userId, id);
    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "CATEGORY_IN_USE") {
      return res.status(400).json({
        message:
          "You cannot delete this category because there are transactions using it. Please delete or reassign those transactions first.",
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

