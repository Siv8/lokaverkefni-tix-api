import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

async function getToken(email: string) {
  await request(app).post("/auth/register").send({
    name: "NoBookings",
    email,
    password: "password123",
  });

  const login = await request(app).post("/auth/login").send({
    email,
    password: "password123",
  });

  return login.body.token as string;
}

describe("UC7: GET /bookings empty history", () => {
  it("returns empty list when user has no bookings", async () => {
    const token = await getToken("nobookings@test.is");

    const res = await request(app)
      .get("/bookings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(0);
  });
});