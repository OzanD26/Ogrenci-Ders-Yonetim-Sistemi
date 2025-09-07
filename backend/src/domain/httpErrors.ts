// src/domain/httpErrors.ts
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function prismaToHttpError(e: unknown): HttpError {
  // benzersiz alan ihlali
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return new HttpError(409, "Unique constraint violated");
    }
    if (e.code === "P2025") {
      return new HttpError(404, "Record not found");
    }
  }
  return new HttpError(500, "Internal server error");
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  const http = prismaToHttpError(err);
  return res.status(http.status).json({ message: http.message });
}
