// src/domain/students.controller.ts
import { Router, type Request, type Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { HttpError, prismaToHttpError } from "./httpErrors";
import { Prisma } from "@prisma/client";


export const studentsRouter = Router();

// helper: alan doğrulama
function parseAndValidateStudentBody(body: any) {
  const firstName = String(body?.firstName ?? "").trim();
  const lastName = String(body?.lastName ?? "").trim();
  const birthDateRaw = body?.birthDate;

  if (!firstName) throw new HttpError(400, "First name is required");
  if (!lastName) throw new HttpError(400, "Last name is required");
  if (!birthDateRaw) throw new HttpError(400, "Birth date is required");

  const birthDate = new Date(birthDateRaw);
  if (Number.isNaN(birthDate.getTime())) {
    throw new HttpError(400, "Birth date is invalid");
  }
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birthDate > todayOnly) {
    throw new HttpError(400, "Birth date cannot be in the future");
  }

  return { firstName, lastName, birthDate };
}

// helper: pagination
function parsePaging(q: any) {
  const page = Math.max(parseInt(String(q.page ?? "1"), 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(String(q.pageSize ?? "10"), 10) || 10, 1), 100);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}

// GET /api/students?page=&pageSize=&q=
// GET /api/students?page=&pageSize=&q=
studentsRouter.get("/students", async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePaging(req.query);
    const q = String(req.query.q ?? "").trim();

    // 🔧 Tipi açıkça belirt ve mode için enum kullan
    const where: Prisma.StudentWhereInput = q
      ? {
          OR: [
            { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { lastName:  { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.student.findMany({ where, skip, take, orderBy: { id: "desc" } }),
      prisma.student.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    next(e);
  }
});


// GET /api/students/:id
studentsRouter.get("/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

    const student = await prisma.student.findUnique({
      where: { id },
      include: { enrollments: { include: { course: true } } },
    });
    if (!student) throw new HttpError(404, "Student not found");
    res.json(student);
  } catch (e) {
    next(e);
  }
});

// POST /api/students
studentsRouter.post("/students", async (req, res, next) => {
  try {
    const { firstName, lastName, birthDate } = parseAndValidateStudentBody(req.body);
    const created = await prisma.student.create({
      data: { firstName, lastName, birthDate },
    });
    res.status(201).json(created);
  } catch (e) {
    next(prismaToHttpError(e));
  }
});

// PUT /api/students/:id
studentsRouter.put("/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

    const { firstName, lastName, birthDate } = parseAndValidateStudentBody(req.body);

    const updated = await prisma.student.update({
      where: { id },
      data: { firstName, lastName, birthDate },
    });
    res.json(updated);
  } catch (e) {
    next(prismaToHttpError(e));
  }
});

// DELETE /api/students/:id
studentsRouter.delete("/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

    await prisma.student.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    next(prismaToHttpError(e));
  }
});
