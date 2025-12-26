import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { postBooking, getBookings, deleteBooking  } from "../controllers/bookingsController";

export const bookingsRouter = Router();

bookingsRouter.post("/", requireAuth, postBooking);
bookingsRouter.get("/", requireAuth, getBookings);
bookingsRouter.delete("/:id", requireAuth, deleteBooking);