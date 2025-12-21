import type { Request, Response } from "express";
import { listUpcomingEvents } from "../services/eventsService";

export async function getEvents(_req: Request, res: Response) {
  const events = await listUpcomingEvents();
  res.json({ items: events });
}