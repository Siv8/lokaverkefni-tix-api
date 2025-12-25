import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

describe("POST /auth/register", () => {
  it("registers a user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Bob", email: "bob@test.is", password: "secret123" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe("bob@test.is");
  });

  it("rejects duplicate email", async () => {
    await request(app)
      .post("/auth/register")
      .send({ name: "Bob", email: "dup@test.is", password: "secret123" });

    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Bob2", email: "dup@test.is", password: "secret123" });

    expect(res.status).toBe(409);
  });

  it("validates input", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "x@test.is" });

    expect(res.status).toBe(400);
  });
});