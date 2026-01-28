// backend/Config/mysql.js


/*export const pool = mysql.createPool({
  host: "hopper.proxy.rlwy.net",
  port: 18197,
  user: "root",
  password: "eOKmnHYRvXvEVyovmfoLuIgnwqFHzaDk",
  database: "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
*/

import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "shally2003@@",
  database: "asset_management",
  port: 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
