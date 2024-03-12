import { FastifyInstance } from "fastify"
import oauthPlugin from "@fastify/oauth2"
import type { CookieSerializeOptions } from "@fastify/cookie"
import { userService } from "../services/userService"
import { AuthProvider, authService } from "../services/authService"
import { env } from "../env"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { authProviderParamsScheme } from "$/models"

export const cookieSettings = {
  domain: env.domain || "localhost",
  path: "/",
  sameSite: "lax",
  secure: env.isProduction,
} satisfies CookieSerializeOptions

export function configureAuthRoutes(app: FastifyInstance) {
  app
    .register(oauthPlugin, {
      name: "googleOAuth2",
      credentials: {
        client: env.auth0.google,
        auth: oauthPlugin.GOOGLE_CONFIGURATION,
      },
      scope: ["profile", "email", "openid"],
      startRedirectPath: "/login/google",
      callbackUri: `${env.url}/login/google/callback`,
    })
    .register(oauthPlugin, {
      name: "githubOAuth2",
      credentials: {
        client: env.auth0.github,
        auth: oauthPlugin.GITHUB_CONFIGURATION,
      },
      scope: [],
      startRedirectPath: "/login/github",
      callbackUri: `${env.url}/login/github/callback`,
    })

  app.withTypeProvider<ZodTypeProvider>().get(
    "/login/:provider/callback",
    {
      schema: {
        params: authProviderParamsScheme,
      },
    },
    async function (request, reply) {
      const provider = request.params.provider

      const access_token = await authService.getProviderToken(
        provider,
        app,
        request
      )
      if (!access_token) throw "Failed to get 'access_token'"
      const providerData = await authService.loadProviderData(
        provider,
        access_token
      )
      if (!providerData) throw "Failed to get 'providerData'"
      const { providerId, name, picture, email } =
        authService.normalizeProviderData(provider, providerData)

      const userAuth = await authService.getByProviderId(provider, providerId)

      let userId = userAuth?.userId
      const user = await (userId
        ? userService.getById(userId)
        : userService.upsert({
            name,
            avatarUrl: picture,
          }))
      if (!user) throw "Failed to load user"
      userId = user.id
      if (!userAuth) {
        await authService.upsert({
          email,
          provider,
          providerId,
          userId,
        })
      }

      reply.setCookie("user", JSON.stringify(user), {
        ...cookieSettings,
        httpOnly: true,
      })

      reply.redirect("/")
    }
  )

  app.get("/logout", async function (_, reply) {
    reply.clearCookie("user", {
      ...cookieSettings,
      httpOnly: true,
    })

    reply.redirect("/")
  })
}
