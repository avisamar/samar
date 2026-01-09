import db from "@/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import * as dbSchema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: dbSchema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [admin()],
});