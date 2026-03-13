import { Request, Response } from "express";
import { z } from "zod";
import { loginUser, registerUser } from "../services/authService";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerHandler(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);
    const user = await registerUser(body);
    return res.status(201).json(user);
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already in use" });
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body);
    return res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.issues });
    }
    if (err.message === "Invalid credentials") {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

