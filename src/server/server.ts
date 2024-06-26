// https://github.com/royalswe/vike-fastify-boilerplate/blob/main/server/index.ts
import { renderPage } from "vike/server"

import fastify from "fastify"
import compress from "@fastify/compress"
import cookie from "@fastify/cookie"
import { OAuth2Namespace } from "@fastify/oauth2"
import fStatic from "@fastify/static"
import fWebsocket from "@fastify/websocket"
import jwt from "jsonwebtoken"

import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod"

import { env } from "./env"
import { configureAuthRoutes } from "./api/auth"
import { configurePollRoutes } from "./api/polls"
import { socketService } from "./services/socketService"
import { authService } from "./services/authService"
import { UserModel } from "$/drizzle/tables"

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: {
      (request: FastifyRequest, reply: FastifyReply): Promise<void>
    }
    googleOAuth2: OAuth2Namespace
    githubOAuth2: OAuth2Namespace
  }
  export interface Session {
    anonId: string
  }
}

const root = process.cwd()
async function startServer() {
  const app = fastify()
    .setValidatorCompiler(validatorCompiler)
    .setSerializerCompiler(serializerCompiler)
    .register(cookie)
    .register(fWebsocket, {
      errorHandler(error, connection) {
        connection.destroy(error)
      },
      options: {
        maxPayload: 64,
      },
    })
    .register(compress, { global: true })
    .setErrorHandler(function (error, _, reply) {
      // Log error
      this.log.error(error)

      // Send error response
      reply
        .status(error.statusCode ?? 500)
        .send({ message: error.message ?? "Internal Server Error" })
    })
  app.register(function (app, opts, done) {
    app.route({
      method: "GET",
      url: "/ws",
      handler: (_, res) => res.status(400).send(),
      wsHandler: socketService.handleConnection.bind(socketService),
    })
    done()
  })

  // await register(app, {
  //   jsonSchemas: buildJsonSchemas(models),
  // })

  if (env.isProduction) {
    app.register(fStatic, {
      root: `${root}/dist/client/assets`,
      prefix: "/assets",
    })
  } else {
    // Instantiate Vite's development server and integrate its middleware to our server.
    // ⚠️ We should instantiate it *only* in development. (It isn't needed in production
    // and would unnecessarily bloat our server in production.)
    const vite = await import("vite")
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true },
      })
    ).middlewares

    app.addHook("onRequest", async (request, reply) => {
      const next = () =>
        new Promise<void>((resolve) => {
          viteDevMiddleware(request.raw, reply.raw, () => resolve())
        })
      await next()
    })
  }

  app.get("/favicon.ico", (_, res) => {
    res.status(404).send()
  })

  configureAuthRoutes(app)
  configurePollRoutes(app)

  app.get("*", async (request, reply) => {
    let user: UserModel | null = null
    try {
      user = authService.getRequestUser(request)
      if (user) authService.setRequestUser(reply, user)
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        user = null
        authService.clearRequestUser(reply)
      }
      console.error(error)
    }

    const pageContextInit = {
      urlOriginal: request.raw.url || "",
      user: user,
    }
    const pageContext = await renderPage(pageContextInit)
    const { httpResponse } = pageContext
    if (!httpResponse) {
      reply.callNotFound()
      return
    } else {
      const { headers } = httpResponse
      headers.forEach(([name, value]) => reply.raw.setHeader(name, value))

      httpResponse.pipe(reply.raw)
      return reply
    }
  })

  return app
}
async function main() {
  const fastify = await startServer()
  const {
    server: { host, port },
    url,
  } = env
  try {
    fastify.listen({ host, port }, function (err) {
      if (err) {
        fastify.log.error(err)
        console.error(err)
        process.exit(1)
      }
      console.log(`Server listening at ${url}`)
    })
  } catch (error) {
    console.error(error)
  }
}

main()
