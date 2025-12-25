import { pool } from "../db";

export type VenueDetails = {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  events: Array<{
    id: number;
    title: string;
    startsAt: string;
  }>;
};

export async function getVenueById(venueId: number): Promise<VenueDetails | null> {
  const venueSql = `
    SELECT id, name, address, city, capacity
    FROM venues
    WHERE id = $1
  `;

  const venueRes = await pool.query(venueSql, [venueId]);
  if (venueRes.rowCount === 0) return null;

  const v = venueRes.rows[0];

  const eventsSql = `
    SELECT id, title, starts_at
    FROM events
    WHERE venue_id = $1
      AND starts_at > NOW()
    ORDER BY starts_at ASC
  `;

  const eventsRes = await pool.query(eventsSql, [venueId]);

  return {
    id: Number(v.id),
    name: v.name,
    address: v.address,
    city: v.city,
    capacity: Number(v.capacity),
    events: eventsRes.rows.map((e) => ({
      id: Number(e.id),
      title: e.title,
      startsAt: new Date(e.starts_at).toISOString(),
    })),
  };
}