import { pool } from "./Config/mysql.js";

async function test() {
  try {
    const [rows] = await pool.query("SELECT 1+1 AS result");
    console.log("MySQL Connected! Test Result:", rows);
  } catch (error) {
    console.error("MySQL ERROR:", error);
  }
}

test();
