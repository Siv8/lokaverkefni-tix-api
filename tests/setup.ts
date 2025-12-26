import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, beforeEach } from "vitest";
import { pool } from "../src/db";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const schemaPath = path.resolve(process.cwd(), "sql", "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf8");

async function seedBase() {
  await pool.query(`
    -- categories
    INSERT INTO categories (name)
    VALUES ('Tónleikar'), ('Íþróttir'), ('Leikhús');

    -- venues
    INSERT INTO venues (name, address, city, capacity)
    VALUES ('Harpa', 'Austurbakki 2', 'Reykjavík', 1800);

    -- events
    -- id 1: future (>24h)
    -- id 2: future (>24h)
    -- id 3: within 24h (edge case for cancel)
    INSERT INTO events (title, description, starts_at, venue_id, category_id)
    VALUES
      ('Dæmi event', 'Test event', NOW() + INTERVAL '3 days', 1, 1),
      ('Ódýrari event', 'Cheap', NOW() + INTERVAL '10 days', 1, 1),
      ('Seint að cancela', 'Too late', NOW() + INTERVAL '2 hours', 1, 1);

    -- tickets
    INSERT INTO tickets (event_id, name, price_isk, quantity_total)
    VALUES
      (1, 'General Admission', 9900, 200),
      (2, 'General Admission', 5000, 100),
      (3, 'General Admission', 7000, 50);
  `);
}
beforeAll(async () => {
  await pool.query(schemaSql);
});

beforeEach(async () => {
  await pool.query(`
    TRUNCATE TABLE
      booking_tickets,
      bookings,
      tickets,
      events,
      venues,
      categories,
      users
    RESTART IDENTITY CASCADE;
  `);

  await seedBase();
});