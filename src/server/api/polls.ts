import { FastifyInstance } from "fastify"
import { pollService } from "../services/pollService"
import { pollFormScheme, pollIdScheme, pollVoteScheme } from "$/models"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { socketService } from "../services/socketService"
import { authService } from "../services/authService"

export function configurePollRoutes(app: FastifyInstance) {
  app.get("/api/polls", async function (request) {
    const user = authService.getRequestUser(request)
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
        const user = authService.getRequestUser(req)
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
      const user = authService.getRequestUser(req)
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
      const user = authService.getRequestUser(req)
      if (!user) throw { statusCode: 401, message: "Unauthorized" }
      const didVote = await pollService.vote(
        req.params.id,
        user.id,
        req.body.pollOptionId
      )
      if (!didVote) return res.code(400).send(undefined)

      const newVoteCounts = await pollService.getVoteCounts(req.params.id)
      // wsRouter.$synced.voteCounts[req.params.id] = newVoteCounts
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
