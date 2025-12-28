import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

async function getToken(email: string) {
  await request(app).post("/auth/register").send({
    name: "PastEvent",
    email,
    password: "password123",
  });

  const login = await request(app).post("/auth/login").send({
    email,
    password: "password123",
  });

  return login.body.token as string;
}

describe("UC6: POST /bookings past event", () => {
  it("rejects booking for an event in the past", async () => {
    const token = await getToken("past@test.is");

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 4, items: [{ ticketId: 4, quantity: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(String(res.body.error).toLowerCase()).toContain("future");
  });
});