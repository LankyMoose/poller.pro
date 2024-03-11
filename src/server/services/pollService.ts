import {
  PollModel,
  PollOptionModel,
  UserModel,
  pollOptions,
  pollVotes,
  polls,
  users,
} from "$/drizzle/tables"
import { PollFormScheme } from "$/models"
import { and, count, desc, eq } from "drizzle-orm"
import { db } from "./db"

export type PollWithMeta = {
  id: number
  text: string
  createdAt: number
  closed: boolean | null
  user: {
    id: number
    avatarUrl: string | null
    name: string
  }
  pollOptions: {
    id: number
    text: string
  }[]
  userVote: number | null
}

type PartialPollWithMeta = Omit<PollWithMeta, "user" | "pollOptions"> & {
  user?: PollWithMeta["user"]
  pollOptions?: PollWithMeta["pollOptions"]
}

export const pollService = {
  async getLatestPolls(user?: UserModel): Promise<PollWithMeta[]> {
    console.log("getLatestPolls")
    try {
      const res = await db
        .select({
          id: polls.id,
          text: polls.text,
          createdAt: polls.createdAt,
          closed: polls.closed,
          user: {
            id: users.id,
            avatarUrl: users.avatarUrl,
            name: users.name,
          },
          pollOptions: {
            id: pollOptions.id,
            text: pollOptions.text,
          },
          userVote: pollVotes.optionId,
        })
        .from(polls)
        .leftJoin(users, eq(polls.userId, users.id))
        .leftJoin(pollOptions, eq(polls.id, pollOptions.pollId))
        .leftJoin(
          pollVotes,
          and(
            eq(polls.id, pollVotes.pollId),
            eq(pollVotes.userId, user?.id || -1)
          )
        )
        .where(eq(polls.deleted, false))
        .orderBy(desc(polls.createdAt))
        .limit(20)

      const mapped = res.reduce((acc, cur) => {
        let poll = acc.find((p) => p.id === cur.id)
        if (!poll) {
          poll = {
            id: cur.id,
            text: cur.text,
            closed: cur.closed,
            createdAt: cur.createdAt,
            userVote: cur.userVote,
          }

          acc.push(poll)
        }
        if (!poll.user && cur.user) {
          poll.user = {
            id: cur.user.id,
            avatarUrl: cur.user.avatarUrl,
            name: cur.user.name,
          }
        }
        if (cur.pollOptions) {
          poll.pollOptions = [...(poll.pollOptions || []), cur.pollOptions]
        }
        return acc
      }, [] as PartialPollWithMeta[])

      return mapped as PollWithMeta[]
    } catch (error) {
      console.error("getLatestPolls err", error)
      return []
    }
  },
  async getPollVotes(pollId: number) {
    return db
      .select({
        optionId: pollVotes.optionId,
        count: count(pollVotes.optionId).as("count"),
      })
      .from(pollVotes)
      .where(eq(pollVotes.pollId, pollId))
      .groupBy(pollVotes.optionId)
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
