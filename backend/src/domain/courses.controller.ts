// src/domain/courses.controller.ts
import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../prisma";
import { HttpError, prismaToHttpError } from "./httpErrors";
import { Prisma } from "@prisma/client";

export const coursesRouter = Router();

/* -------- Helpers -------- */
function parseAndValidateCourseBody(body: any) {
  const name = String(body?.name ?? "").trim();
  if (!name) throw new HttpError(400, "Course name is required");
  return { name };
}

function parsePaging(q: any) {
  const page = Math.max(parseInt(String(q.page ?? "1"), 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(String(q.pageSize ?? "10"), 10) || 10, 1), 100);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}

/* -------- Routes -------- */

/**
 * GET /api/courses?page=&pageSize=&q=
 * Arama: q (name contains, case-insensitive)
 * Dönüş: { items, total, page, pageSize }
 */
coursesRouter.get("/courses", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, skip, take } = parsePaging(req.query);
    const q = String(req.query.q ?? "").trim();

    // Tip güvenli where
    const where: Prisma.CourseWhereInput = q
      ? { name: { contains: q, mode: Prisma.QueryMode.insensitive } }
      : {};

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { id: "desc" },
        select: { id: true, name: true, createdAt: true },
      }),
      prisma.course.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/courses/:id
 * Detay + bu dersi alan öğrenciler
 */
coursesRouter.get("/courses/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: {
          orderBy: { createdAt: "desc" },
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!course) throw new HttpError(404, "Course not found");
    res.json(course);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/courses
 */
coursesRouter.post("/courses", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = parseAndValidateCourseBody(req.body);
    const created = await prisma.course.create({ data: { name } });
    res.status(201).json(created);
  } catch (e) {
    next(prismaToHttpError(e)); // P2002 => 409 (unique violation)
  }
});

/**
 * PUT /api/courses/:id
 */
coursesRouter.put("/courses/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

    const { name } = parseAndValidateCourseBody(req.body);
    const updated = await prisma.course.update({ where: { id }, data: { name } });
    res.json(updated);
  } catch (e) {
    next(prismaToHttpError(e)); // P2002 => 409
  }
});

/**
 * DELETE /api/courses/:id
 */
coursesRouter.delete("/courses/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

    await prisma.course.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    next(prismaToHttpError(e));
  }
});
