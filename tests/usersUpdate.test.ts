import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/app";

async function registerAndLogin(email: string) {
  await request(app).post("/auth/register").send({ name: "U", email, password: "password123" });
  const login = await request(app).post("/auth/login").send({ email, password: "password123" });
  return login.body.token as string;
}

describe("PUT /users/me", () => {
  it("401 without token", async () => {
    const res = await request(app).put("/users/me").send({ name: "X" });
    expect(res.status).toBe(401);
  });

  it("updates name + email", async () => {
    const token = await registerAndLogin("u1@test.is");

    const res = await request(app)
      .put("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name", email: "u1-new@test.is" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
    expect(res.body.email).toBe("u1-new@test.is");
  });

  it("updates password (old fails, new works)", async () => {
    const email = "u2@test.is";
    const token = await registerAndLogin(email);

    const upd = await request(app)
      .put("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "newpass123" });

    expect(upd.status).toBe(200);

    const oldLogin = await request(app).post("/auth/login").send({ email, password: "password123" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post("/auth/login").send({ email, password: "newpass123" });
    expect(newLogin.status).toBe(200);
  });

  it("409 on email conflict", async () => {
    await registerAndLogin("a@test.is"); 
    const tokenB = await registerAndLogin("b@test.is");

    const res = await request(app)
      .put("/users/me")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ email: "a@test.is" });

    expect(res.status).toBe(409);
  });
});