import bcrypt from "bcrypt";
import { pool } from "../db";

const SALT_ROUNDS = 10;

export type UpdateMeInput = {
  name?: string;
  email?: string;
  password?: string;
};

export type UserPublic = {
  id: number;
  name: string;
  email: string;
};

export async function updateMe(userId: number, input: UpdateMeInput): Promise<UserPublic | null> {
  const fields: string[] = [];
  const params: any[] = [];
  const add = (v: any) => {
    params.push(v);
    return `$${params.length}`;
  };

  if (input.name !== undefined) fields.push(`name = ${add(input.name)}`);
  if (input.email !== undefined) fields.push(`email = ${add(input.email)}`);
  if (input.password !== undefined) {
    const hash = await bcrypt.hash(input.password, SALT_ROUNDS);
    fields.push(`password_hash = ${add(hash)}`);
  }

  if (fields.length === 0) {
    const res = await pool.query(`SELECT id, name, email FROM users WHERE id = $1`, [userId]);
    if (res.rowCount === 0) return null;
    return { id: Number(res.rows[0].id), name: res.rows[0].name, email: res.rows[0].email };
  }

  fields.push(`updated_at = NOW()`);

  const sql = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${params.length + 1}
    RETURNING id, name, email
  `;

  try {
    const res = await pool.query(sql, [...params, userId]);
    if (res.rowCount === 0) return null;
    return { id: Number(res.rows[0].id), name: res.rows[0].name, email: res.rows[0].email };
  } catch (err: any) {
    if (err.code === "23505") return null;
    throw err;
  }
  }

  export async function deleteMe(userId: number) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const bookingsRes = await client.query(
      `
      SELECT b.id AS booking_id
      FROM bookings b
      JOIN events e ON e.id = b.event_id
      WHERE b.user_id = $1
        AND b.status = 'CONFIRMED'
        AND e.starts_at > NOW() + INTERVAL '24 hours'
      FOR UPDATE
      `,
      [userId]
    );

    const bookingIds = bookingsRes.rows.map((r) => Number(r.booking_id));

    for (const bookingId of bookingIds) {
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
    }

    const delRes = await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    if (delRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return Promise.reject({ status: 404, message: "User not found" });
    }

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