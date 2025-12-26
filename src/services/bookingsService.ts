import { pool } from "../db";

export type CreateBookingInput = {
  eventId: number;
  items: Array<{ ticketId: number; quantity: number }>;
};

export type CreateBookingResult = {
  id: number;
  eventId: number;
  userId: number;
  status: "CONFIRMED";
  items: Array<{ ticketId: number; quantity: number; unitPriceIsk: number }>;
};

export async function createBooking(userId: number, input: CreateBookingInput): Promise<CreateBookingResult> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const eventRes = await client.query(
      `SELECT id, starts_at FROM events WHERE id = $1 FOR UPDATE`,
      [input.eventId]
    );

    if (eventRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return Promise.reject({ status: 404, message: "Event not found" });
    }

    const startsAt = new Date(eventRes.rows[0].starts_at).getTime();
    if (startsAt <= Date.now()) {
      await client.query("ROLLBACK");
      return Promise.reject({ status: 400, message: "Event is not in the future" });
    }

    const ticketIds = input.items.map((x) => x.ticketId);
    const uniqueTicketIds = Array.from(new Set(ticketIds));

    const ticketsRes = await client.query(
      `
      SELECT id, price_isk, quantity_total, quantity_sold
      FROM tickets
      WHERE event_id = $1 AND id = ANY($2::bigint[])
      FOR UPDATE
      `,
      [input.eventId, uniqueTicketIds]
    );

    if (ticketsRes.rowCount !== uniqueTicketIds.length) {
      await client.query("ROLLBACK");
      return Promise.reject({ status: 400, message: "One or more tickets are invalid for this event" });
    }

    const ticketMap = new Map<number, { priceIsk: number; total: number; sold: number }>();
    for (const r of ticketsRes.rows) {
      ticketMap.set(Number(r.id), {
        priceIsk: Number(r.price_isk),
        total: Number(r.quantity_total),
        sold: Number(r.quantity_sold),
      });
    }

    const qtyByTicket = new Map<number, number>();
    for (const it of input.items) {
      qtyByTicket.set(it.ticketId, (qtyByTicket.get(it.ticketId) ?? 0) + it.quantity);
    }

    for (const [ticketId, qty] of qtyByTicket.entries()) {
      const t = ticketMap.get(ticketId)!;
      const available = t.total - t.sold;
      if (qty > available) {
        await client.query("ROLLBACK");
        return Promise.reject({ status: 400, message: "Not enough tickets available" });
      }
    }

    const bookingRes = await client.query(
      `
      INSERT INTO bookings (user_id, event_id, status)
      VALUES ($1, $2, 'CONFIRMED')
      RETURNING id
      `,
      [userId, input.eventId]
    );

    const bookingId = Number(bookingRes.rows[0].id);

    const itemsOut: CreateBookingResult["items"] = [];

    for (const [ticketId, qty] of qtyByTicket.entries()) {
      const t = ticketMap.get(ticketId)!;

      await client.query(
        `
        INSERT INTO booking_tickets (booking_id, ticket_id, quantity, unit_price_isk)
        VALUES ($1, $2, $3, $4)
        `,
        [bookingId, ticketId, qty, t.priceIsk]
      );

      await client.query(
        `
        UPDATE tickets
        SET quantity_sold = quantity_sold + $1
        WHERE id = $2
        `,
        [qty, ticketId]
      );

      itemsOut.push({ ticketId, quantity: qty, unitPriceIsk: t.priceIsk });
    }

    await client.query("COMMIT");

    return {
      id: bookingId,
      eventId: input.eventId,
      userId,
      status: "CONFIRMED",
      items: itemsOut,
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}
export type BookingListItem = {
  id: number;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
  cancelledAt: string | null;
  event: { id: number; title: string; startsAt: string };
  items: Array<{ ticketId: number; quantity: number; unitPriceIsk: number }>;
};

export async function listBookingsForUser(userId: number): Promise<BookingListItem[]> {
  const sql = `
    SELECT
      b.id AS booking_id,
      b.status,
      b.created_at,
      b.cancelled_at,
      e.id AS event_id,
      e.title AS event_title,
      e.starts_at AS event_starts_at,
      bt.ticket_id,
      bt.quantity,
      bt.unit_price_isk
    FROM bookings b
    JOIN events e ON e.id = b.event_id
    LEFT JOIN booking_tickets bt ON bt.booking_id = b.id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC, b.id DESC
  `;

  const res = await pool.query(sql, [userId]);

  const map = new Map<number, BookingListItem>();

  for (const r of res.rows) {
    const bookingId = Number(r.booking_id);

    if (!map.has(bookingId)) {
      map.set(bookingId, {
        id: bookingId,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
        cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : null,
        event: {
          id: Number(r.event_id),
          title: r.event_title,
          startsAt: new Date(r.event_starts_at).toISOString(),
        },
        items: [],
      });
    }
    if (r.ticket_id !== null) {
      map.get(bookingId)!.items.push({
        ticketId: Number(r.ticket_id),
        quantity: Number(r.quantity),
        unitPriceIsk: Number(r.unit_price_isk),
      });
    }
  }

  return Array.from(map.values());
}
export async function cancelBooking(userId: number, bookingId: number) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingRes = await client.query(
      `
      SELECT
        b.id,
        b.status,
        b.user_id,
        e.starts_at
      FROM bookings b
      JOIN events e ON e.id = b.event_id
      WHERE b.id = $1
      FOR UPDATE
      `,
      [bookingId]
    );

    if (bookingRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return Promise.reject({ status: 404, message: "Booking not found" });
    }

    const b = bookingRes.rows[0];

    if (Number(b.user_id) !== userId) {
      await client.query("ROLLBACK");
      return Promise.reject({ status: 403, message: "Forbidden" });
    }

    if (b.status === "CANCELLED") {
      await client.query("ROLLBACK");
      return Promise.reject({ status: 409, message: "Booking already cancelled" });
    }

    const startsAt = new Date(b.starts_at).getTime();
    const hoursUntil = (startsAt - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 24) {
      await client.query("ROLLBACK");
      return Promise.reject({ status: 400, message: "Too late to cancel booking" });
    }

    const itemsRes = await client.query(
      `
      SELECT ticket_id, quantity
      FROM booking_tickets
      WHERE booking_id = $1
      FOR UPDATE
      `,
      [bookingId]
    );

    for (const it of itemsRes.rows) {
      await client.query(
        `
        UPDATE tickets
        SET quantity_sold = quantity_sold - $1
        WHERE id = $2
        `,
        [Number(it.quantity), Number(it.ticket_id)]
      );
    }

    await client.query(
      `
      UPDATE bookings
      SET status = 'CANCELLED', cancelled_at = NOW()
      WHERE id = $1
      `,
      [bookingId]
    );

    await client.query("COMMIT");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}