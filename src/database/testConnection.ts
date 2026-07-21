import { db } from "./database";

export async function testConnection() {
  const result = await db.query("SELECT NOW()");

  console.log(result.rows[0]);
}
