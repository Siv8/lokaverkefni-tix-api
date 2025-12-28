import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

describe("UC1: GET /events empty results", () => {
  it("returns empty list when no events match filters", async () => {
    const res = await request(app).get("/events?city=Akureyri");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(0);
  });
});
