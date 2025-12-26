import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

async function getToken() {
  await request(app)
    .post("/auth/register")
    .send({ name: "C", email: "c@test.is", password: "password123" });

  const login = await request(app)
    .post("/auth/login")
    .send({ email: "c@test.is", password: "password123" });

  return login.body.token as string;
}

describe("DELETE /bookings/:id", () => {
  it("401 without token", async () => {
    const res = await request(app).delete("/bookings/1");
    expect(res.status).toBe(401);
  });

  it("cancels booking when >24h before event", async () => {
    const token = await getToken();

    const created = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 1, items: [{ ticketId: 1, quantity: 1 }] });

    const bookingId = created.body.id;

    const res = await request(app)
      .delete(`/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("rejects cancelling twice", async () => {
    const token = await getToken();

    const created = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 1, items: [{ ticketId: 1, quantity: 1 }] });

    const bookingId = created.body.id;

    await request(app)
      .delete(`/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .delete(`/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  it("rejects cancelling within 24 hours of event start", async () => {
    const token = await getToken();
    const created = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 3, items: [{ ticketId: 3, quantity: 1 }] });

    expect(created.status).toBe(201);

    const bookingId = created.body.id;

    const res = await request(app)
      .delete(`/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Too late to cancel booking" });
  });
});