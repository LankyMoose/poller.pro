import { FastifyInstance, FastifyRequest } from "fastify"
import { pollService } from "../services/pollService"
import { UserModel } from "$/drizzle/tables"

export function configurePollRoutes(app: FastifyInstance) {
  app.get("/api/polls", async function (request) {
    const user = getUser(request)
    return pollService.getLatestPolls(user)
  })
  app.zod.post(
    "/api/polls",
    { operationId: "addPoll", body: `pollFormScheme` },
    async function (req) {
      const user = getUser(req)
      if (!user) throw { statusCode: 401, message: "Unauthorized" }
      return pollService.addPoll(req.body, user)
    }
  )
  app.zod.delete(
    "/api/polls/:id",
    {
      operationId: "deletePoll",
      params: "pollIdScheme",
    },
    async function (req, res) {
      const user = getUser(req)
      if (!user) throw { statusCode: 401, message: "Unauthorized" }
      await pollService.deletePoll(req.params.id, user.id, !!user.isAdmin)
      return res.code(200).send(undefined)
    }
  )
  app.zod.post(
    "/api/polls/:id/vote",
    {
      operationId: "vote",
      params: "pollIdScheme",
      body: "pollVoteScheme",
    },
    async function (req, res) {
      const user = getUser(req)
      if (!user) throw { statusCode: 401, message: "Unauthorized" }
      await pollService.vote(req.params.id, user.id, req.body.pollOptionId)
      return res.code(200).send(undefined)
    }
  )
}

function getUser(request: FastifyRequest): UserModel | undefined {
  return request.cookies["user"]
    ? JSON.parse(request.cookies["user"])
    : undefined
}
