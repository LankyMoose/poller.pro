import { FastifyInstance, FastifyRequest } from "fastify"
import { pollService } from "../services/pollService"
import { UserModel } from "$/drizzle/tables"

export function configurePollRoutes(app: FastifyInstance) {
  app.get("/api/polls", async function () {
    return pollService.getLatestPolls()
  })
  app.zod.post(
    "/api/polls",
    { operationId: "addPoll", body: `pollFormScheme` },
    async function (request) {
      const user = getUser(request)
      if (!user) throw { statusCode: 401, message: "Unauthorized" }
      return pollService.addPoll(request.body, user)
    }
  )
  app.zod.delete(
    "/api/polls/:id",
    {
      operationId: "deletePoll",
      params: "pollIdScheme",
    },
    async function (request, response) {
      const user = getUser(request)
      if (!user) throw { statusCode: 401, message: "Unauthorized" }

      await pollService.deletePoll(request.params.id, user.id, !!user.isAdmin)
      return response.code(200)
    }
  )
}

function getUser(request: FastifyRequest): UserModel | undefined {
  return request.cookies["user"]
    ? JSON.parse(request.cookies["user"])
    : undefined
}
