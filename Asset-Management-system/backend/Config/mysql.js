// backend/Config/mysql.js
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "hopper.proxy.rlwy.net",
  port: 18197,
  user: "root",
<<<<<<< HEAD
  password: "shally2003@@",        // put your MySQL password if you have one
  database: "asset_management",
=======
  password: "eOKmnHYRvXvEVyovmfoLuIgnwqFHzaDk",
  database: "railway",
>>>>>>> 8b2872b2d1c98c56cf02adf18f296d97328da71c
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

