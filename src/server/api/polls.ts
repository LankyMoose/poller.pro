import { FastifyInstance, FastifyRequest } from "fastify"
import { pollService } from "../services/pollService"
import { UserModel } from "$/drizzle/tables"
import { pollFormScheme, pollIdScheme, pollVoteScheme } from "$/models"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { socketService } from "../services/socketService"

export function configurePollRoutes(app: FastifyInstance) {
  app.get("/api/polls", async function (request) {
    const user = getUser(request)
    const res = await pollService.getLatestPolls(user)
    res.forEach(({ id }) =>
      socketService.createPollSubscriptionSet(id.toString())
    )
    return res
  })
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      "/api/polls",
      { schema: { body: pollFormScheme } },
      async function (req) {
        const user = getUser(req)
        if (!user) throw { statusCode: 401, message: "Unauthorized" }
        return pollService.addPoll(req.body, user)
      }
    )
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/api/polls/:id",
    {
      schema: {
        params: pollIdScheme,
      },
    },
    async function (req, res) {
      const user = getUser(req)
      if (!user) throw { statusCode: 401, message: "Unauthorized" }
      const didDelete = await pollService.deletePoll(
        req.params.id,
        user.id,
        !!user.isAdmin
      )
      if (!didDelete) return res.code(400).send(undefined)
      socketService.deletePollSubscriptionSet(req.params.id.toString())
      return res.code(200).send(undefined)
    }
  )
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/api/polls/:id/vote",
    schema: {
      params: pollIdScheme,
      body: pollVoteScheme,
    },
    handler: async (req, res) => {
      const user = getUser(req)
      if (!user) throw { statusCode: 401, message: "Unauthorized" }
      const didVote = await pollService.vote(
        req.params.id,
        user.id,
        req.body.pollOptionId
      )
      if (!didVote) return res.code(400).send(undefined)

      const newVoteCounts = await pollService.getVoteCounts(req.params.id)
      socketService.broadcastUpdate(
        req.params.id.toString(),
        {
          type: "~voteCounts",
          pollId: req.params.id,
          votes: newVoteCounts,
        },
        (id, msg) =>
          id === user.id ? { ...msg, userVote: req.body.pollOptionId } : msg
      )

      return res.code(200).send(undefined)
    },
  })
}

function getUser(request: FastifyRequest): UserModel | undefined {
  return request.cookies["user"]
    ? JSON.parse(request.cookies["user"])
    : undefined
}
