import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

async function getToken(email: string) {
  await request(app)
    .post("/auth/register")
    .send({ name: "User", email, password: "password123" });

  const login = await request(app)
    .post("/auth/login")
    .send({ email, password: "password123" });

  return login.body.token as string;
}

describe("DELETE /bookings/:id", () => {
  it("401 without token", async () => {
    const res = await request(app).delete("/bookings/1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when booking is missing", async () => {
    const token = await getToken("missing@test.is");

    const res = await request(app)
      .delete("/bookings/999999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 403 when booking belongs to another user", async () => {
    const tokenA = await getToken("a_cancel@test.is");
    const tokenB = await getToken("b_cancel@test.is");

    const created = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ eventId: 1, items: [{ ticketId: 1, quantity: 1 }] });

    expect(created.status).toBe(201);
    const bookingId = created.body.id;

   
    const res = await request(app)
      .delete(`/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });

  it("cancels booking when >24h before event", async () => {
    const token = await getToken("okcancel@test.is");

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
    const token = await getToken("twice@test.is");

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
    const token = await getToken("latecancel@test.is");

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