import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = { sub: string; email?: string };

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email?: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = header.slice("bearer ".length).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) return res.status(401).json({ error: "Invalid token" });

    req.user = { id, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}