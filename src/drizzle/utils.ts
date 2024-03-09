import { string } from "$/utils"
import { text } from "drizzle-orm/sqlite-core"

export function createHashColumn(length = 6) {
  return text("hash", { length })
    .notNull()
    .$defaultFn(() => string.random(6))
}
