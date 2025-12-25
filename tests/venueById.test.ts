import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

describe("GET /venues/:id", () => {
  it("returns venue with upcoming events", async () => {
    const res = await request(app).get("/venues/1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name");
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it("returns 404 for missing venue", async () => {
    const res = await request(app).get("/venues/999999");
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid id", async () => {
    const res = await request(app).get("/venues/abc");
    expect(res.status).toBe(400);
  });
});