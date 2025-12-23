// backend/Config/mysql.js
import mysql from "mysql2/promise";


export const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "9835397556",        // put your MySQL password if you have one
  database: "asset_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


