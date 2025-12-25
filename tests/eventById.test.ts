import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

describe("GET /events/:id", () => {
  it("returns 200 for existing event", async () => {
    const res = await request(app).get("/events/1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("tickets");
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });

  it("returns 404 for missing event", async () => {
    const res = await request(app).get("/events/999999");
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid id", async () => {
    const res = await request(app).get("/events/abc");
    expect(res.status).toBe(400);
  });
});