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
import { and, count, desc, eq, sql } from "drizzle-orm"
import { db } from "./db"
import { alias } from "drizzle-orm/sqlite-core"

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
  pollVotes: { count: number; optionId: number }[]
  userVote: number | null
}

type PartialPollWithMeta = Omit<PollWithMeta, "user" | "pollOptions"> & {
  user?: PollWithMeta["user"]
  pollOptions?: PollWithMeta["pollOptions"]
  pollVotes?: PollWithMeta["pollVotes"]
}

export const pollService = {
  async getLatestPolls(user?: UserModel): Promise<PollWithMeta[]> {
    const userVotes = alias(pollVotes, "userVote")
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
          userVote: userVotes.optionId,
          pollVotes: {
            count: sql<number>`count(${pollVotes.optionId})`.as("count"),
            optionId: pollVotes.optionId,
          },
        })
        .from(polls)
        .leftJoin(pollVotes, eq(polls.id, pollVotes.pollId))
        .leftJoin(users, eq(polls.userId, users.id))
        .leftJoin(pollOptions, eq(polls.id, pollOptions.pollId))
        .leftJoin(
          userVotes,
          and(
            eq(polls.id, userVotes.pollId),
            eq(userVotes.userId, user?.id || -1)
          )
        )
        .groupBy(
          polls.id,
          users.id,
          pollOptions.id,
          userVotes.optionId,
          pollVotes.optionId
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
            pollVotes: [],
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
        if (
          cur.pollOptions &&
          !poll.pollOptions?.find((p) => p.id === cur.pollOptions?.id)
        ) {
          poll.pollOptions = [...(poll.pollOptions || []), cur.pollOptions]
        }
        if (
          cur.pollVotes &&
          !poll.pollVotes?.find((p) => p.optionId === cur.pollVotes?.optionId)
        ) {
          poll.pollVotes = [...(poll.pollVotes || []), cur.pollVotes]
        }
        return acc
      }, [] as PartialPollWithMeta[])

      return mapped as PollWithMeta[]
    } catch (error) {
      console.error("getLatestPolls err", error)
      return []
    }
  },
  async addPoll(poll: PollFormScheme, user: UserModel): Promise<PollWithMeta> {
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

      return {
        ...poll,
        user,
        pollOptions: optionsRes,
        pollVotes: [],
        userVote: null,
      }
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
  async vote(pollId: number, userId: number, optionId: number) {
    return db
      .insert(pollVotes)
      .values({ pollId, userId, optionId })
      .onConflictDoUpdate({
        target: [pollVotes.pollId, pollVotes.userId],
        set: { optionId },
      })
  },
}
