import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    dialect: "postgres",
    logging: false,
  }
);

export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}