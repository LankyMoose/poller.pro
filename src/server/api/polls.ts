import { FastifyInstance, FastifyRequest } from "fastify"
import { pollService } from "../services/pollService"
import { UserModel } from "$/drizzle/tables"
import { subscribeToPolls } from "../socket"
import { pollFormScheme, pollIdScheme, pollVoteScheme } from "$/models"
import { ZodTypeProvider } from "fastify-type-provider-zod"

export function configurePollRoutes(app: FastifyInstance) {
  app.get("/api/polls", async function (request) {
    const user = getUser(request)
    const res = await pollService.getLatestPolls(user)
    subscribeToPolls(
      request,
      res.map((p) => p.id.toString())
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
      await pollService.deletePoll(req.params.id, user.id, !!user.isAdmin)
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
      await pollService.vote(req.params.id, user.id, req.body.pollOptionId)
      return res.code(200).send(undefined)
    },
  })
}

function getUser(request: FastifyRequest): UserModel | undefined {
  return request.cookies["user"]
    ? JSON.parse(request.cookies["user"])
    : undefined
}
