import type { Request, Response } from "express";
import { getVenueById } from "../services/venuesService";

export async function getVenue(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid venue id" });
  }

  const venue = await getVenueById(id);
  if (!venue) {
    return res.status(404).json({ error: "Venue not found" });
  }

  res.json(venue);
}