import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

describe("GET /events sorting", () => {
  it("sorts by date asc", async () => {
    const res = await request(app).get("/events?sort=date&order=asc");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    const items = res.body.items as Array<{ startsAt: string }>;
    for (let i = 1; i < items.length; i++) {
      const prev = new Date(items[i - 1].startsAt).getTime();
      const curr = new Date(items[i].startsAt).getTime();
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it("sorts by price asc (minPriceIsk)", async () => {
    const res = await request(app).get("/events?sort=price&order=asc");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    const items = res.body.items as Array<{ minPriceIsk: number | null }>;
    const prices = items
      .map((x) => x.minPriceIsk)
      .filter((x): x is number => typeof x === "number");

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i - 1]).toBeLessThanOrEqual(prices[i]);
    }
  });
});