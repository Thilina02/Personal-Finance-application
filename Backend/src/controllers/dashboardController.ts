import { Response } from "express";
import { getDashboardData } from "../services/dashboardService";
import { AuthRequest } from "../middleware/auth";

export async function dashboardHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const data = await getDashboardData(userId);
    return res.json(data);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

