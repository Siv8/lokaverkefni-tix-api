import type { Request, Response } from "express";
import { registerUser,loginUser  } from "../services/authService";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const user = await registerUser(name, email, password);
  if (!user) {
    return res.status(409).json({ error: "Email already in use" });
  }

  res.status(201).json(user);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  const result = await loginUser(email, password);
  if (!result) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.json(result);
}