import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { env } from "../env";

const prisma = new PrismaClient();

export type RegisterStudentInput = {
  email: string;
  password: string;           // düz şifre (hash bizde)
  firstName: string;
  lastName: string;
  birthDate: string;          // ISO (frontend yyyy-MM-dd gönderiyor olabilir)
};

export type LoginInput = { email: string; password: string };

export async function registerStudent(input: RegisterStudentInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    const err: any = new Error("Email is already in use.");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  // User + Student birlikte oluştur (userId unique)
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: passwordHash,      // şemadaki alanın adı 'password'
      role: "STUDENT",
      student: {
        create: {
          firstName: input.firstName,
          lastName: input.lastName,
          birthDate: new Date(input.birthDate),
        },
      },
    },
    include: { student: true },
  });

  const token = signToken(user.id, user.role, user.email);
  return { token, user };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { student: true },
  });
  if (!user) throw unauthorized();

  const ok = await bcrypt.compare(input.password, user.password);
  if (!ok) throw unauthorized();

  const token = signToken(user.id, user.role, user.email);
  return { token, user };
}

function signToken(id: number, role: Role, email: string) {
  const payload = { sub: String(id), id, role, email };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

function unauthorized() {
  const err: any = new Error("Invalid credentials");
  err.status = 401;
  return err;
}
