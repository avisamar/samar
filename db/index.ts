import { drizzle } from "drizzle-orm/neon-http";
import { config as loadEnv } from "dotenv";
import path from "path";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  // Amplify builds can emit .env.production while runtime env is missing.
  loadEnv({ path: path.join(process.cwd(), ".env.production") });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const db = drizzle(process.env.DATABASE_URL);

export default db;
