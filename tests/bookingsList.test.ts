import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

async function getToken() {
  await request(app)
    .post("/auth/register")
    .send({ name: "Buyer", email: "buyer2@test.is", password: "password123" });

  const login = await request(app)
    .post("/auth/login")
    .send({ email: "buyer2@test.is", password: "password123" });

  return login.body.token as string;
}

describe("GET /bookings", () => {
  it("401 without token", async () => {
    const res = await request(app).get("/bookings");
    expect(res.status).toBe(401);
  });

  it("returns bookings with event info + items", async () => {
    const token = await getToken();

    const created = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 1, items: [{ ticketId: 1, quantity: 2 }] });

    expect(created.status).toBe(201);

    const res = await request(app)
      .get("/bookings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);

    const b = res.body.items[0];
    expect(b).toHaveProperty("id");
    expect(b).toHaveProperty("status");
    expect(b).toHaveProperty("createdAt");
    expect(b).toHaveProperty("event");
    expect(b.event).toHaveProperty("id");
    expect(b.event).toHaveProperty("title");
    expect(b.event).toHaveProperty("startsAt");
    expect(Array.isArray(b.items)).toBe(true);
    expect(b.items[0]).toHaveProperty("ticketId");
    expect(b.items[0]).toHaveProperty("quantity");
    expect(b.items[0]).toHaveProperty("unitPriceIsk");
  });
});