import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { env } from "../env";

const prisma = new PrismaClient();

export type RegisterStudentInput = {
  email: string;
  password: string;          // düz şifre (hash bizde)
  firstName: string;
  lastName: string;
  birthDate: string;         // "yyyy-MM-dd" veya ISO
};

export type LoginInput = { email: string; password: string };

export async function registerStudent(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  birthDate: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) {
    const err: any = new Error("Email is already in use.");
    err.status = 409;
    throw err;
  }

  const parsedBirth = parseBirthDate(birthDate);
  if (!parsedBirth) {
    const err: any = new Error("Invalid birthDate");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: passwordHash,   // şemada alan adı 'password'
      role: "STUDENT",
      student: {
        create: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          birthDate: parsedBirth,
        },
      },
    },
    include: { student: true },
  });

  const token = signToken(user.id, user.role, user.email);
  return { token, user };
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { student: true },
  });
  if (!user) throw unauthorized();

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw unauthorized();

  const token = signToken(user.id, user.role, user.email);
  return { token, user };
}

export async function me(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      student: true,
    },
  });
}

/** Öğrencinin kayıtlı olduğu dersler */
export async function myCourses(userId: number) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      enrollments: {
        select: { course: { select: { id: true, name: true } }, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!student) return [];
  return student.enrollments.map((e) => e.course);
}

/** Öğrenci: kendini bir derse kaydeder (unique control + 409) */
export async function enrollMyself(userId: number, courseId: number) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student) {
    const err: any = new Error("Student profile not found");
    err.status = 404; throw err;
  }

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) {
    const err: any = new Error("Course not found");
    err.status = 404; throw err;
  }

  // @@unique([studentId, courseId]) ile aynı derse 2. kayıt engellenir
  const exists = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId } },
  });
  if (exists) {
    const err: any = new Error("Already enrolled to this course");
    err.status = 409; throw err;
  }

  await prisma.enrollment.create({
    data: { studentId: student.id, courseId },
  });

  return { ok: true };
}

/** Öğrenci: bir dersten kaydını siler */
export async function dropMyself(userId: number, courseId: number) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student) {
    const err: any = new Error("Student profile not found");
    err.status = 404; throw err;
  }

  const enr = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId } },
  });
  if (!enr) {
    const err: any = new Error("Enrollment not found");
    err.status = 404; throw err;
  }

  await prisma.enrollment.delete({ where: { id: enr.id } });
  return { ok: true };
}

/* helpers */
function signToken(id: number, role: Role, email: string) {
  const payload = { sub: String(id), id, role, email };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

function unauthorized() {
  const err: any = new Error("Invalid credentials");
  err.status = 401;
  return err;
}

function parseBirthDate(input: string): Date | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // geleceğe tarih engeli (opsiyonel ama mantıklı)
  const today = new Date();
  const todayUtc = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (d > todayUtc) return null;
  return d;
}
