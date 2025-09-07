import { Router } from "express";

// Modül router’ları
import { usersRouter } from "./users.controller";
import { studentsRouter } from "./students.controller";
import { coursesRouter } from "./courses.controller";
import { enrollmentsRouter } from "./enrollments.controller";


export const routes = Router();

// --- Auth & Users ---
routes.use(usersRouter);

// --- Admin CRUD ---
routes.use(studentsRouter);
routes.use(coursesRouter);
routes.use(enrollmentsRouter);

// ileride başka modüller eklersen buraya ekleyebilirsin
