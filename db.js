// db.js - Vercel compatible
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// ===== POOL WITH CONNECTION LIMITS FOR SERVERLESS =====
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Serverless optimization
  max: 1, // Maximum pool size (keep low for serverless)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// ===== TEST CONNECTION (optional - only logs in development) =====
if (process.env.NODE_ENV !== "production") {
  pool
    .connect()
    .then((client) => {
      console.log("Database connected ✅");
      client.release();
    })
    .catch((err) => console.error("DB connection error ❌", err));
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});