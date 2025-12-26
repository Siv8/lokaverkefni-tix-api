import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { me } from "../controllers/usersController";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, me);