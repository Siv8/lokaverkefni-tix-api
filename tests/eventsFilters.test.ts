import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

describe("GET /events filters", () => {
  it("filters by city", async () => {
    const res = await request(app).get("/events?city=Reykjavík");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    for (const e of res.body.items) {
      expect(e.venue.city).toBe("Reykjavík");
    }
  });

  it("filters by categoryId", async () => {
    const res = await request(app).get("/events?categoryId=1");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    for (const e of res.body.items) {
      expect(e.category.id).toBe(1);
    }
  });

  it("filters by date range", async () => {
    const res = await request(app).get("/events?from=2025-12-01&to=2026-01-31");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    for (const e of res.body.items) {
      const d = new Date(e.startsAt).getTime();
      expect(d).toBeGreaterThanOrEqual(new Date("2025-12-01").getTime());
      expect(d).toBeLessThan(new Date("2026-02-01").getTime()); // to + 1 day logic
    }
  });
});