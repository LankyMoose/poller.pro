import {
  PollModel,
  PollOptionModel,
  UserModel,
  pollOptions,
  polls,
} from "$/drizzle/tables"
import { PollFormScheme } from "$/models"
import { and, eq } from "drizzle-orm"
import { db } from "./db"

export type PollWithMetaList = Awaited<
  ReturnType<typeof pollService.getLatestPolls>
>
export type PollWithMeta = PollWithMetaList[number]

export const pollService = {
  async getLatestPolls() {
    return db.query.polls.findMany({
      with: {
        user: {
          columns: {
            id: true,
            avatarUrl: true,
            name: true,
          },
        },
        pollOptions: {
          columns: {
            id: true,
            text: true,
          },
        },
      },
    })
  },
  async addPoll(poll: PollFormScheme, user: UserModel) {
    const { options, ...rest } = poll

    return await db.transaction(async (tx) => {
      const poll: PollModel = await tx
        .insert(polls)
        .values({ ...rest, userId: user.id })
        .returning()
        .get()

      const optionsRes: PollOptionModel[] = await tx
        .insert(pollOptions)
        .values(
          options.map((o) => ({
            text: o,
            pollId: poll.id,
          }))
        )
        .returning()
        .all()

      return { ...poll, user, pollOptions: optionsRes }
    })
  },
  async deletePoll(id: number, userId: number, isAdmin: boolean) {
    return db
      .delete(polls)
      .where(
        isAdmin
          ? eq(polls.id, id)
          : and(eq(polls.id, id), eq(polls.userId, userId))
      )
  },
}
