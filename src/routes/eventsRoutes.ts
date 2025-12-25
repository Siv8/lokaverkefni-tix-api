import { Router } from "express";
import { getEvents, getEvent } from "../controllers/eventsController";

export const eventsRouter = Router();

eventsRouter.get("/", getEvents);
eventsRouter.get("/:id", getEvent);

