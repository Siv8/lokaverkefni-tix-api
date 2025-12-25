import { Router } from "express";
import { getVenue } from "../controllers/venuesController";

export const venuesRouter = Router();

venuesRouter.get("/:id", getVenue);