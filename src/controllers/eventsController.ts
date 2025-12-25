import type { Request, Response } from "express";
import { listUpcomingEvents } from "../services/eventsService";
import { getEventById } from "../services/eventsService";

export async function getEvents(req: Request, res: Response) {
  const city = typeof req.query.city === "string" ? req.query.city : undefined;

  const categoryId =
    typeof req.query.categoryId === "string" && req.query.categoryId.trim() !== ""
      ? Number(req.query.categoryId)
      : undefined;

  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  const sort = req.query.sort === "price" ? "price" : "date";
  const order = req.query.order === "desc" ? "desc" : "asc";


  const safeCategoryId = categoryId && Number.isFinite(categoryId) ? categoryId : undefined;

  const items = await listUpcomingEvents({
    city,
    categoryId: safeCategoryId,
    from,
    to,
    sort,
    order,
  });

  res.json({ items });
}

export async function getEvent(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid event id" });
  }

  const event = await getEventById(id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  return res.json(event);
}