import { relations } from "drizzle-orm"
import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core"

import { polls } from "./polls"
import { pollVotes } from "./pollVotes"
import { UTC } from "$/utils"

export { pollOptions, pollOptionRelations }
export type { PollOptionModel, PollOptionInsertModel }

const pollOptions = sqliteTable(
  "poll_option",
  {
    id: integer("id").primaryKey(),
    pollId: integer("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: integer("created_at").notNull().$defaultFn(UTC.now),
  },
  (table) => ({
    pollIdIdx: index("poll_option_poll_id_idx").on(table.pollId),
  })
)

const pollOptionRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  pollVotes: many(pollVotes),
}))

type PollOptionModel = typeof pollOptions.$inferSelect
type PollOptionInsertModel = typeof pollOptions.$inferInsert
