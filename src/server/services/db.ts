import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"

import { env } from "../env"
import * as schema from "$/drizzle/schema"

const { url, authToken } = env.db

export const client = createClient({ url, authToken })
export const db = drizzle(client, { schema })
