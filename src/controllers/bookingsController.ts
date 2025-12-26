import type { Request, Response } from "express";
import { createBooking, listBookingsForUser, cancelBooking   } from "../services/bookingsService";

export async function postBooking(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { eventId, items } = req.body ?? {};

  if (!Number.isFinite(eventId) || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid input" });
  }

  for (const it of items) {
    if (!it || !Number.isFinite(it.ticketId) || !Number.isFinite(it.quantity) || it.quantity <= 0) {
      return res.status(400).json({ error: "Invalid input" });
    }
  }

  try {
    const booking = await createBooking(userId, { eventId, items });
    return res.status(201).json(booking);
  } catch (e: any) {
    if (e?.status && e?.message) {
      return res.status(e.status).json({ error: e.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getBookings(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const items = await listBookingsForUser(userId);
  return res.json({ items });
}
export async function deleteBooking(req: Request, res: Response) {
  const userId = req.user?.id;
  const bookingId = Number(req.params.id);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!Number.isFinite(bookingId)) {
    return res.status(400).json({ error: "Invalid booking id" });
  }

  try {
    await cancelBooking(userId, bookingId);
    return res.status(204).send();
  } catch (e: any) {
    if (e?.status && e?.message) {
      return res.status(e.status).json({ error: e.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}