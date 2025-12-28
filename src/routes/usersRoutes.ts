import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { me, updateMeHandler, deleteMeHandler  } from "../controllers/usersController";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, me);
usersRouter.put("/me", requireAuth, updateMeHandler);
usersRouter.delete("/me", requireAuth, deleteMeHandler);