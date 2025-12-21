import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { eventsRouter } from "./routes/eventsRoutes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

import { healthCheck } from "./db";

app.get("/db-health", async (_req, res) => {
  const row = await healthCheck();
  res.json({ ok: true, dbTime: row.now });
});

app.use("/events", eventsRouter);
