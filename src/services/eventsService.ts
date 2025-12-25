import { pool } from "../db";

export type EventListItem = {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  venue: { id: number; name: string; city: string };
  category: { id: number; name: string };
  minPriceIsk: number | null;
};

export type EventDetails = {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  venue: { id: number; name: string; address: string; city: string; capacity: number };
  category: { id: number; name: string };
  tickets: Array<{
    id: number;
    name: string;
    priceIsk: number;
    quantityTotal: number;
    quantitySold: number;
    quantityAvailable: number;
  }>;
};

type ListEventsOptions = {
  city?: string;
  categoryId?: number;
  from?: string;
  to?: string; 
  sort?: "date" | "price";
  order?: "asc" | "desc";
};

export async function listUpcomingEvents(
  opts: ListEventsOptions = {}
): Promise<EventListItem[]> {
  const where: string[] = ["e.starts_at > NOW()"];
  const params: Array<string | number> = [];

  const addParam = (value: string | number) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (opts.city) {
    where.push(`v.city ILIKE ${addParam(opts.city)}`);
  }

  if (opts.categoryId) {
    where.push(`e.category_id = ${addParam(opts.categoryId)}`);
  }

  if (opts.from) {
    where.push(`e.starts_at >= (${addParam(opts.from)}::date)`);
  }

  if (opts.to) {
    where.push(`e.starts_at < ((${addParam(opts.to)}::date) + INTERVAL '1 day')`);
  }

  const orderDir = (opts.order ?? "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  const orderBy =
    (opts.sort ?? "date") === "price"
      ? `min_price_isk ${orderDir} NULLS LAST, e.starts_at ASC`
      : `e.starts_at ${orderDir}`;

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
      c.name AS category_name,
      MIN(t.price_isk) AS min_price_isk
    FROM events e
    JOIN venues v ON v.id = e.venue_id
    JOIN categories c ON c.id = e.category_id
    LEFT JOIN tickets t ON t.event_id = e.id
    WHERE ${where.join(" AND ")}
    GROUP BY e.id, v.id, c.id
    ORDER BY ${orderBy}
  `;

  const result = await pool.query(sql, params);

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
    minPriceIsk: r.min_price_isk === null ? null : Number(r.min_price_isk),
  }));
}

export async function getEventById(eventId: number): Promise<EventDetails | null> {
  const eventSql = `
    SELECT
      e.id, e.title, e.description, e.starts_at,
      v.id AS venue_id, v.name AS venue_name, v.address AS venue_address, v.city AS venue_city, v.capacity AS venue_capacity,
      c.id AS category_id, c.name AS category_name
    FROM events e
    JOIN venues v ON v.id = e.venue_id
    JOIN categories c ON c.id = e.category_id
    WHERE e.id = $1
  `;

  const eventRes = await pool.query(eventSql, [eventId]);
  if (eventRes.rowCount === 0) return null;

  const e = eventRes.rows[0];

  const ticketsSql = `
    SELECT id, name, price_isk, quantity_total, quantity_sold
    FROM tickets
    WHERE event_id = $1
    ORDER BY price_isk ASC, id ASC
  `;
  const ticketsRes = await pool.query(ticketsSql, [eventId]);

  const tickets = ticketsRes.rows.map((t) => {
    const total = Number(t.quantity_total);
    const sold = Number(t.quantity_sold);
    return {
      id: Number(t.id),
      name: t.name,
      priceIsk: Number(t.price_isk),
      quantityTotal: total,
      quantitySold: sold,
      quantityAvailable: Math.max(0, total - sold),
    };
  });

  return {
    id: Number(e.id),
    title: e.title,
    description: e.description ?? "",
    startsAt: new Date(e.starts_at).toISOString(),
    venue: {
      id: Number(e.venue_id),
      name: e.venue_name,
      address: e.venue_address,
      city: e.venue_city,
      capacity: Number(e.venue_capacity),
    },
    category: {
      id: Number(e.category_id),
      name: e.category_name,
    },
    tickets,
  };
}