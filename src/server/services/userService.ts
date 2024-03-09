import { eq } from "drizzle-orm"
import { db } from "./db"
import { UserInsertModel, UserModel, users } from "$/drizzle/schema"

export const userService = {
  async getById(id: number): Promise<UserModel | undefined> {
    try {
      return (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },
  async upsert(user: UserInsertModel): Promise<UserModel | undefined> {
    try {
      if (!user.id) {
        return (await db.insert(users).values(user).returning()).at(0)
      }
      return (
        await db
          .update(users)
          .set(user)
          .where(eq(users.id, user.id))
          .returning()
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },
}
