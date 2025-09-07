// src/domain/enrollments.controller.ts
import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../prisma";
import { HttpError, prismaToHttpError } from "./httpErrors";

export const enrollmentsRouter = Router();

/* -------- Helpers -------- */
function parsePaging(q: any) {
  const page = Math.max(parseInt(String(q.page ?? "1"), 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(String(q.pageSize ?? "10"), 10) || 10, 1), 100);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}

/* -------- Routes -------- */

// GET /api/enrollments?page=&pageSize=
enrollmentsRouter.get("/enrollments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, skip, take } = parsePaging(req.query);

    const [items, total] = await Promise.all([
      prisma.enrollment.findMany({
        skip,
        take,
        orderBy: { id: "desc" },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          course: { select: { id: true, name: true } },
        },
      }),
      prisma.enrollment.count(),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    next(e);
  }
});

// GET /api/enrollments/:id
enrollmentsRouter.get("/enrollments/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

    const enr = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        course: { select: { id: true, name: true } },
      },
    });
    if (!enr) throw new HttpError(404, "Enrollment not found");
    res.json(enr);
  } catch (e) {
    next(e);
  }
});

// POST /api/enrollments  { studentId, courseId }
enrollmentsRouter.post("/enrollments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = Number(req.body?.studentId);
    const courseId = Number(req.body?.courseId);

    if (!Number.isFinite(studentId)) throw new HttpError(400, "studentId is required");
    if (!Number.isFinite(courseId)) throw new HttpError(400, "courseId is required");

    // varlık kontrolü (daha okunaklı hata için)
    const [s, c] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ]);
    if (!s) throw new HttpError(404, "Student not found");
    if (!c) throw new HttpError(404, "Course not found");

    const created = await prisma.enrollment.create({
      data: { studentId, courseId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        course: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(created);
  } catch (e: any) {
    // @@unique([studentId, courseId]) ihlali → 409
    if (e.code === "P2002") {
      return next(new HttpError(409, "This student is already enrolled in the selected course"));
    }
    next(prismaToHttpError(e));
  }
});

// DELETE /api/enrollments/:id
enrollmentsRouter.delete("/enrollments/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

    await prisma.enrollment.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    next(prismaToHttpError(e));
  }
});
