// src/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// graceful shutdown (opsiyonel ama iyi olur)
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
