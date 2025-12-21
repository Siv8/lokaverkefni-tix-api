import { pool } from "../db";

export type EventListItem = {
  id: number;
  title: string;
  description: string;
  startsAt: string; 
  venue: {
    id: number;
    name: string;
    city: string;
  };
  category: {
    id: number;
    name: string;
  };
};

export async function listUpcomingEvents(): Promise<EventListItem[]> {
  const sql = `
    SELECT
      e.id,
      e.title,
      e.description,
      e.starts_at,
      v.id   AS venue_id,
      v.name AS venue_name,
      v.city AS venue_city,
      c.id   AS category_id,
      c.name AS category_name
    FROM events e
    JOIN venues v ON v.id = e.venue_id
    JOIN categories c ON c.id = e.category_id
    WHERE e.starts_at > NOW()
    ORDER BY e.starts_at ASC
  `;

  const result = await pool.query(sql);

  return result.rows.map((r) => ({
    id: Number(r.id),
    title: r.title,
    description: r.description ?? "",
    startsAt: new Date(r.starts_at).toISOString(),
    venue: {
      id: Number(r.venue_id),
      name: r.venue_name,
      city: r.venue_city,
    },
    category: {
      id: Number(r.category_id),
      name: r.category_name,
    },
  }));
}