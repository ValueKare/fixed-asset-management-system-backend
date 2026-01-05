// backend/Config/mysql.js
// backend/Config/mysql.js
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "hopper.proxy.rlwy.net",
  port: 18197,
  user: "root",
  password: "shally2003@@",        // put your MySQL password if you have one
  database: "asset_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

