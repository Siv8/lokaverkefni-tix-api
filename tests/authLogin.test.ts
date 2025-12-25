import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

describe("POST /auth/login", () => {
  it("returns token for valid credentials", async () => {
    await request(app)
      .post("/auth/register")
      .send({ name: "Alice", email: "alice@test.is", password: "password123" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "alice@test.is", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });

  it("returns 401 for wrong password", async () => {
    await request(app)
      .post("/auth/register")
      .send({ name: "Bob", email: "bob@test.is", password: "password123" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "bob@test.is", password: "wrong" });

    expect(res.status).toBe(401);
  });

  it("validates input", async () => {
    const res = await request(app).post("/auth/login").send({ email: "x@test.is" });
    expect(res.status).toBe(400);
  });
});