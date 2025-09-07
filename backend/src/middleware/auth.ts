// backend/src/middleware/auth.ts
import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { env } from "../env";

export type AuthedUser = {
  id: number;
  role: "ADMIN" | "STUDENT";
  email: string;                // <-- email eklendi
};

export type AuthedRequest = Request & { user?: AuthedUser };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  const token = hdr?.startsWith("Bearer ") ? hdr.substring(7) : undefined;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;

    // signToken zaten { id, role, email } koyuyor
    req.user = {
      id: Number(payload.id),
      role: payload.role as "ADMIN" | "STUDENT",
      email: String(payload.email),
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles: Array<"ADMIN" | "STUDENT">) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
