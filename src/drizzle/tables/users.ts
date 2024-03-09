import { UTC, string } from "$/utils"
import { relations } from "drizzle-orm"
import {
  text,
  integer,
  sqliteTable,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core"
import { polls } from "./polls"
import { pollVotes } from "./pollVotes"
import { createHashColumn } from "../utils"

export { users, userRelations, userAuths, userAuthRelations }
export type { UserModel, UserInsertModel, UserAuthModel, UserAuthInsertModel }

const users = sqliteTable(
  "user",
  {
    id: integer("id").primaryKey(),
    hash: createHashColumn(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    isAdmin: integer("is_admin", { mode: "boolean" }),
    createdAt: integer("created_at").notNull().$defaultFn(UTC.now),
    disabled: integer("disabled", { mode: "boolean" }).default(false),
  },
  (users) => ({ nameIdx: uniqueIndex("id_idx").on(users.name) })
)

type UserModel = typeof users.$inferSelect
type UserInsertModel = typeof users.$inferInsert

const userRelations = relations(users, ({ many }) => ({
  userAuths: many(userAuths),
  polls: many(polls),
  pollVotes: many(pollVotes),
}))

const userAuths = sqliteTable(
  "user_auth",
  {
    id: integer("id").primaryKey(),
    email: text("email"),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerId: text("provider_id").notNull(),
  },
  (table) => ({
    emailIdx: index("user_auth_email_idx").on(table.email),
    userIdIdx: index("user_auth_user_id_idx").on(table.userId),
    providerIdIdx: index("user_auth_provider_id_idx").on(table.providerId),
  })
)

const userAuthRelations = relations(userAuths, ({ one }) => ({
  user: one(users, {
    fields: [userAuths.userId],
    references: [users.id],
  }),
}))

type UserAuthModel = typeof userAuths.$inferSelect
type UserAuthInsertModel = typeof userAuths.$inferInsert
