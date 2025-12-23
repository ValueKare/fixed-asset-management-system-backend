// backend/Config/mysqlSetup.js
import poolPromise from "./mysql.js";

export default async function initMySQLSchema() {
  const pool = await poolPromise;

  // -------------------------------
  // TABLE 1 → Hospital_assets MASTER TABLE
  // -------------------------------
  const createFarTable = `
    CREATE TABLE IF NOT EXISTS nbc_assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class VARCHAR(100),
      bus_A VARCHAR(100),
      cost_centre VARCHAR(100),
      sno VARCHAR(100),
      asset VARCHAR(100),
      asset_description TEXT,
      asset_main_no_text VARCHAR(100), //Sap style
      quantity INT,
      amount DECIMAL(15,2),
      dc_start VARCHAR(100),
      depky VARCHAR(50),
      use_percentage VARCHAR(50),
      CostOrder VARCHAR(100),
      planned_dep VARCHAR(100),
      CoCd VARCHAR(50),
      description TEXT,
      business_area VARCHAR(100),
      barcode VARCHAR(50),
      asset_key VARCHAR(20),

      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // -------------------------------
  // TABLE 2 → AUDIT TABLE
  // -------------------------------
  const createAuditTable = `
    CREATE TABLE IF NOT EXISTS hospital_assets (
      id INT AUTO_INCREMENT PRIMARY KEY,

      sr_no VARCHAR(50),
      aster_tag_number VARCHAR(100),
      vk_new_tag_number VARCHAR(100),
      make VARCHAR(100),
      model VARCHAR(100),
      block VARCHAR(50),
      wing VARCHAR(50),
      floor VARCHAR(50),
      location VARCHAR(255),

      aster_info_not_in_far TEXT,
      vk_remarks TEXT,
      fa_reco_resolution TEXT,
      aster_spoc_remarks TEXT,
      audit_date VARCHAR(50),

      asset_key VARCHAR(20),
      asset VARCHAR(100),

      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createFarTable);
    await pool.query(createAuditTable);

    console.log("✔ MySQL tables created/verified successfully");
    
  } catch (err) {
    console.error("❌ Failed to initialize MySQL schema:", err);
  }
}
