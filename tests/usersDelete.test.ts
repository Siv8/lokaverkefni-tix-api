import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

async function getToken(email: string) {
  await request(app).post("/auth/register").send({ name: "D", email, password: "password123" });
  const login = await request(app).post("/auth/login").send({ email, password: "password123" });
  return login.body.token as string;
}

describe("DELETE /users/me", () => {
  it("401 without token", async () => {
    const res = await request(app).delete("/users/me");
    expect(res.status).toBe(401);
  });

  it("cancels future bookings (>24h) and returns tickets", async () => {
    const token = await getToken("del@test.is");

    const b = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 1, items: [{ ticketId: 1, quantity: 2 }] });

    expect(b.status).toBe(201);

    const before = await request(app).get("/events/1");
    expect(before.status).toBe(200);
    expect(before.body.tickets[0].quantitySold).toBe(2);

    const del = await request(app)
      .delete("/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(204);

    const after = await request(app).get("/events/1");
    expect(after.status).toBe(200);
    expect(after.body.tickets[0].quantitySold).toBe(0);
  });
});