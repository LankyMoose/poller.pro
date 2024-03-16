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
import { NewVoteCounts, PollWithMeta } from "$/types"

type PartialPollWithMeta = Omit<PollWithMeta, "user" | "pollOptions"> & {
  user?: PollWithMeta["user"]
  pollOptions?: PollWithMeta["pollOptions"]
  pollVotes?: { count: number; optionId: number }[]
}

export const pollService = {
  async getLatestPolls(user?: UserModel): Promise<PollWithMeta[]> {
    const latestPolls = db
      .$with("polls")
      .as(
        db
          .select()
          .from(polls)
          .where(eq(polls.deleted, false))
          .orderBy(desc(polls.createdAt))
          .limit(20)
      )

    const userVotes = alias(pollVotes, "userVote")
    try {
      const res = await db
        .with(latestPolls)
        .select({
          id: latestPolls.id,
          text: latestPolls.text,
          createdAt: latestPolls.createdAt,
          closed: latestPolls.closed,
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
        .from(latestPolls)
        .leftJoin(pollVotes, eq(latestPolls.id, pollVotes.pollId))
        .leftJoin(users, eq(latestPolls.userId, users.id))
        .leftJoin(pollOptions, eq(latestPolls.id, pollOptions.pollId))
        .leftJoin(
          userVotes,
          and(
            eq(latestPolls.id, userVotes.pollId),
            eq(userVotes.userId, user?.id || -1)
          )
        )
        .groupBy(
          latestPolls.id,
          users.id,
          pollOptions.id,
          userVotes.optionId,
          pollVotes.optionId
        )

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
          poll.pollOptions = [
            ...(poll.pollOptions || []),
            { ...cur.pollOptions, count: 0 },
          ]
        }
        if (
          cur.pollVotes &&
          !poll.pollVotes?.find((p) => p.optionId === cur.pollVotes?.optionId)
        ) {
          poll.pollVotes = [...(poll.pollVotes || []), cur.pollVotes]
        }
        return acc
      }, [] as PartialPollWithMeta[])

      return mapped.map((poll) => {
        const { pollVotes, ...rest } = poll
        poll.pollOptions?.forEach((pollOption) => {
          pollOption.count =
            pollVotes?.find((v) => v.optionId === pollOption.id)?.count || 0
        })
        return rest
      }) as PollWithMeta[]
    } catch (error) {
      console.error("getLatestPolls err", error)
      return []
    }
  },
  async addPoll(
    poll: PollFormScheme,
    user: UserModel
  ): Promise<PollWithMeta | undefined> {
    const { options, text } = poll
    return await db.transaction(async (tx) => {
      const poll: PollModel = await tx
        .insert(polls)
        .values({ text: text.trim(), userId: user.id })
        .returning()
        .get()

      const optionsRes: PollOptionModel[] = await tx
        .insert(pollOptions)
        .values(
          options.map((o) => ({
            text: o.trim(),
            pollId: poll.id,
          }))
        )
        .returning()
        .all()

      return {
        ...poll,
        user,
        pollOptions: optionsRes.map((o) => ({
          id: o.id,
          text: o.text,
          count: 0,
        })),
        userVote: null,
      }
    })
  },
  async deletePoll(id: number, userId: number, isAdmin: boolean) {
    const res = await db
      .delete(polls)
      .where(
        isAdmin
          ? eq(polls.id, id)
          : and(eq(polls.id, id), eq(polls.userId, userId))
      )
      .returning()
      .get()
    return !!res
  },
  async vote(pollId: number, userId: number, optionId: number) {
    const poll = await db
      .select({ id: polls.id })
      .from(polls)
      .leftJoin(pollOptions, eq(polls.id, pollOptions.pollId))
      .where(
        and(
          eq(polls.id, pollId),
          eq(polls.deleted, false),
          eq(polls.closed, false),
          eq(pollOptions.id, optionId),
          eq(pollOptions.pollId, pollId)
        )
      )
      .all()
    if (!poll.length) return false

    const res = await db
      .insert(pollVotes)
      .values({ pollId, userId, optionId })
      .onConflictDoUpdate({
        target: [pollVotes.pollId, pollVotes.userId],
        set: { optionId },
      })
      .returning()
      .get()
    if (!res) return false

    return pollId
  },

  async getVoteCounts(pollId: number) {
    return await db
      .select({ id: pollVotes.optionId, count: count(pollVotes.id) })
      .from(pollVotes)
      .leftJoin(
        pollOptions,
        and(
          eq(pollVotes.optionId, pollOptions.id),
          eq(pollVotes.pollId, pollOptions.pollId)
        )
      )
      .where(and(eq(pollVotes.pollId, pollId), eq(pollOptions.pollId, pollId)))
      .groupBy(pollVotes.optionId)
      .all()
  },
}
