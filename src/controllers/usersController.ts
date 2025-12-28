import type { Request, Response } from "express";
import { updateMe, deleteMe  } from "../services/usersService";

export function me(req: Request, res: Response) {
  res.json({ user: req.user });
}

export async function updateMeHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { name, email, password } = req.body ?? {};
  if (
    (name !== undefined && typeof name !== "string") ||
    (email !== undefined && typeof email !== "string") ||
    (password !== undefined && typeof password !== "string")
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  if (password !== undefined && password.length < 6) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const updated = await updateMe(userId, { name, email, password });

  if (!updated) {
    if (email !== undefined) return res.status(409).json({ error: "Email already in use" });
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(updated);
}

export async function deleteMeHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await deleteMe(userId);
    return res.status(204).send();
  } catch (e: any) {
    if (e?.status && e?.message) return res.status(e.status).json({ error: e.message });
    return res.status(500).json({ error: "Internal server error" });
  }
}