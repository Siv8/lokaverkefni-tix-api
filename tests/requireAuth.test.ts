import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

describe("requireAuth", () => {
  it("401 without token", async () => {
    const res = await request(app).get("/users/me");
    expect(res.status).toBe(401);
  });

  it("200 with valid token", async () => {
    await request(app)
      .post("/auth/register")
      .send({ name: "A", email: "a@test.is", password: "password123" });

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "a@test.is", password: "password123" });

    const token = login.body.token;

    const res = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(1);
  });
});