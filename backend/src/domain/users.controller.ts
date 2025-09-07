// backend/src/domain/users.controller.ts
import { Router } from "express";
import { login, registerStudent, me as getMe } from "./users.service";
import { requireAuth, AuthedRequest, requireRole } from "../middleware/auth";
import { prisma } from "../prisma";
import { HttpError, prismaToHttpError } from "./httpErrors";

export const usersRouter = Router();

/* ---------- Auth ---------- */
usersRouter.post("/auth/register", async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, birthDate } = req.body;
    if (!email || !password || !firstName || !lastName || !birthDate) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const result = await registerStudent(email, password, firstName, lastName, birthDate);
    return res.status(201).json({ token: result.token, user: safeUser(result.user) });
  } catch (e) { return next(e); }
});

usersRouter.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    return res.json({ token: result.token, user: safeUser(result.user) });
  } catch (e) { return next(e); }
});

/* ---------- Student-only endpoints ---------- */

// Profilimi getir (flatten + yyyy-MM-dd)
usersRouter.get("/me", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const u = (req as AuthedRequest).user!;
    const me = await prisma.user.findUnique({
      where: { id: u.id },
      include: { student: true },
    });
    if (!me || !me.student) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.json({
      id: me.id,
      email: me.email,
      role: me.role,
      firstName: me.student.firstName,
      lastName: me.student.lastName,
      birthDate: me.student.birthDate?.toISOString().slice(0, 10),
    });
  } catch (e) {
    next(e);
  }
});

// Profilimi güncelle (student tablosu) – aynı response formatı
usersRouter.put("/me", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const u = (req as AuthedRequest).user!;
    const { firstName, lastName, birthDate } = req.body;

    if (!firstName?.trim() || !lastName?.trim() || !birthDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const student = await prisma.student.update({
      where: { userId: u.id },
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        birthDate: new Date(birthDate),
      },
      select: { firstName: true, lastName: true, birthDate: true },
    });

    return res.json({
      id: u.id,
      email: (req as AuthedRequest).user!.email,
      role: (req as AuthedRequest).user!.role,
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      birthDate: student.birthDate
        ? new Date(student.birthDate).toISOString().slice(0, 10)
        : "",
    });
  } catch (e) { return next(prismaToHttpError(e)); }
});

// Kayıtlı olduğum dersler
usersRouter.get("/me/courses", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const u = (req as AuthedRequest).user!;
    const me = await prisma.student.findUnique({
      where: { userId: u.id },
      select: { enrollments: { select: { course: true }, orderBy: { createdAt: "desc" } } },
    });
    const items = (me?.enrollments ?? []).map((e) => e.course);
    return res.json({ items });
  } catch (e) { return next(prismaToHttpError(e)); }
});

// Yeni derse kayıt
usersRouter.post("/me/enroll", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const u = (req as AuthedRequest).user!;
    const courseId = Number(req.body?.courseId);
    if (!courseId) return res.status(400).json({ message: "courseId is required" });

    const student = await prisma.student.findUnique({ where: { userId: u.id } });
    if (!student) throw new HttpError(404, "Student profile not found");

    const created = await prisma.enrollment.create({
      data: { studentId: student.id, courseId },
    });
    return res.status(201).json(created);
  } catch (e: any) {
    if ((e as any)?.code === "P2002") {
      return res.status(409).json({ message: "You are already enrolled in this course." });
    }
    return next(prismaToHttpError(e));
  }
});

// Dersten çık (drop)
usersRouter.delete("/me/enroll/:courseId", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const u = (req as AuthedRequest).user!;
    const courseId = Number(req.params.courseId);
    const student = await prisma.student.findUnique({ where: { userId: u.id } });
    if (!student) throw new HttpError(404, "Student profile not found");

    await prisma.enrollment.delete({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    });
    return res.status(204).end();
  } catch (e) { return next(prismaToHttpError(e)); }
});

/* util */
function safeUser(u: any) {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
}
