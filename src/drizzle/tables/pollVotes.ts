import { relations } from "drizzle-orm"
import {
  integer,
  sqliteTable,
  primaryKey,
  unique,
} from "drizzle-orm/sqlite-core"
import { polls } from "./polls"
import { users } from "./users"
import { pollOptions } from "./pollOptions"

export { pollVotes, pollVoteRelations }
export type { PollVoteModel, PollVoteInsertModel }

const pollVotes = sqliteTable(
  "poll_vote",
  {
    id: integer("id").primaryKey(),
    pollId: integer("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    optionId: integer("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueIdx: unique("unique_idx").on(table.pollId, table.userId),
  })
)

const pollVoteRelations = relations(pollVotes, ({ one }) => ({
  poll: one(polls, {
    fields: [pollVotes.pollId],
    references: [polls.id],
  }),
  user: one(users, {
    fields: [pollVotes.userId],
    references: [users.id],
  }),
  pollOption: one(pollOptions, {
    fields: [pollVotes.optionId],
    references: [pollOptions.id],
  }),
}))

type PollVoteModel = typeof pollVotes.$inferSelect
type PollVoteInsertModel = typeof pollVotes.$inferInsert
