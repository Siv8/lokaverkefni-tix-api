import { Router } from "express";
import { getEvents } from "../controllers/eventsController";

export const eventsRouter = Router();

eventsRouter.get("/", getEvents);
