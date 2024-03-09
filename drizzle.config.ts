import "dotenv/config"
import type { Config } from "drizzle-kit"
import { env } from "./src/server/env"
export default {
  schema: "./src/drizzle/schema.ts",
  out: "./drizzle",
  driver: "turso", // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
  dbCredentials: {
    url: env.db.url,
    authToken: env.db.authToken,
  },
} satisfies Config
