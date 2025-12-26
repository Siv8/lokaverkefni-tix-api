import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

async function getToken() {
  await request(app)
    .post("/auth/register")
    .send({ name: "Buyer", email: "buyer@test.is", password: "password123" });

  const login = await request(app)
    .post("/auth/login")
    .send({ email: "buyer@test.is", password: "password123" });

  return login.body.token as string;
}

describe("POST /bookings", () => {
  it("401 without token", async () => {
    const res = await request(app).post("/bookings").send({
      eventId: 1,
      items: [{ ticketId: 1, quantity: 1 }],
    });
    expect(res.status).toBe(401);
  });

  it("creates booking for available tickets", async () => {
    const token = await getToken();

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 1, items: [{ ticketId: 1, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe("CONFIRMED");
    expect(res.body.items[0].ticketId).toBe(1);
    expect(res.body.items[0].quantity).toBe(2);
  });

  it("rejects oversell", async () => {
    const token = await getToken();

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 1, items: [{ ticketId: 1, quantity: 999999 }] });

    expect(res.status).toBe(400);
  });
});