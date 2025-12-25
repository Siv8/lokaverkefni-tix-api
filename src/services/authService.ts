import bcrypt from "bcrypt";
import { pool } from "../db";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const sql = `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email
  `;

  try {
    const res = await pool.query(sql, [name, email, passwordHash]);
    return res.rows[0];
  } catch (err: any) {
    if (err.code === "23505") {
      return null;
    }
    throw err;
  }
}

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export async function loginUser(email: string, password: string) {
  const sql = `
    SELECT id, name, email, password_hash
    FROM users
    WHERE email = $1
  `;
  const res = await pool.query(sql, [email]);
  if (res.rowCount === 0) return null;

  const u = res.rows[0];
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return null;

  const token = jwt.sign(
    { sub: String(u.id), email: u.email },
    getJwtSecret(),
    { expiresIn: "7d" }
  );

  return { token };
}
