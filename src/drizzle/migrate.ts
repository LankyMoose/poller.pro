import { db, client } from "../server/services/db"
import { migrate } from "drizzle-orm/libsql/migrator"

await migrate(db, { migrationsFolder: "./drizzle" })
client.close()
