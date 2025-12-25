DROP TABLE IF EXISTS booking_tickets;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE venues (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  address    TEXT NOT NULL,
  city       TEXT NOT NULL,
  capacity   INTEGER NOT NULL CHECK (capacity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  starts_at    TIMESTAMPTZ NOT NULL,
  venue_id     BIGINT NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  category_id  BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tickets (
  id             BIGSERIAL PRIMARY KEY,
  event_id       BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  price_isk      INTEGER NOT NULL CHECK (price_isk >= 0),
  quantity_total INTEGER NOT NULL CHECK (quantity_total >= 0),
  quantity_sold  INTEGER NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tickets_quantity_ok CHECK (quantity_sold <= quantity_total)
);

CREATE TABLE bookings (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id     BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  status       TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE booking_tickets (
  booking_id      BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  ticket_id       BIGINT NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_isk  INTEGER NOT NULL CHECK (unit_price_isk >= 0),
  PRIMARY KEY (booking_id, ticket_id)
);