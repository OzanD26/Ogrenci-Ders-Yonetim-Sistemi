import express from "express";
import cors from "cors";
import { routes } from "./domain/routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", routes); // ✅ tüm controllerlar /api altında olacak

app.listen(4000, () => {
  console.log("Backend running on :4000");
});
