import { Pool } from "pg";

export const pool = new Pool(); 

export async function healthCheck() {
  const res = await pool.query("select now() as now");
  return res.rows[0];
}
