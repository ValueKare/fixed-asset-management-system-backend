// backend/Config/mysql.js
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "hopper.proxy.rlwy.net",
  port: 18197,
  user: "root",
  password: "eOKmnHYRvXvEVyovmfoLuIgnwqFHzaDk",
  database: "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});