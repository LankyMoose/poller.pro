import { relations } from "drizzle-orm"
import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core"

import { users } from "./users"
import { UTC } from "$/utils"
import { pollOptions } from "./pollOptions"
import { pollVotes } from "./pollVotes"
import { createHashColumn } from "../utils"

export { polls, pollRelations }
export type { PollModel, PollInsertModel }

const polls = sqliteTable(
  "poll",
  {
    id: integer("id").primaryKey(),
    hash: createHashColumn(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    text: text("title").notNull(),
    deleted: integer("deleted", { mode: "boolean" }).default(false),
    closed: integer("closed", { mode: "boolean" }).default(false),
    createdAt: integer("created_at").notNull().$defaultFn(UTC.now),
  },
  (table) => ({
    userIdIdx: index("poll_user_id_idx").on(table.userId),
  })
)

const pollRelations = relations(polls, ({ one, many }) => ({
  user: one(users, {
    fields: [polls.userId],
    references: [users.id],
  }),
  pollOptions: many(pollOptions),
  pollVotes: many(pollVotes),
}))

type PollModel = typeof polls.$inferSelect
type PollInsertModel = typeof polls.$inferInsert
