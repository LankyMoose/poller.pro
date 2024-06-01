// AuthCallbackState can be whichever parameters you want
// to persist throughout the OAuth process, eg:
// export type AuthCallbackState = {
//   post?: string
//   community?: string
//   newpost?: true
//   newcommunity?: true
// }

import {
  UserAuthInsertModel,
  UserAuthModel,
  UserModel,
  userAuths,
} from "$/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { db } from "./db"
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { AuthProvider } from "$/types"
import jwt from "jsonwebtoken"
import { env } from "../env"
import { cookieSettings } from "../cookies"

export type AuthCallbackState = Record<string, unknown>

export type ProviderInfo<T extends AuthProvider> = T extends AuthProvider.Google
  ? {
      name: string
      picture: string
      id: string
      email: string
    }
  : T extends AuthProvider.Github
    ? {
        login: string
        avatar_url: string
        id: string
        email: string
      }
    : never

export const authService = {
  getRequestUser(request: FastifyRequest) {
    const tkn = request.cookies["token"]
    if (!tkn) return null
    const decoded = jwt.verify(tkn, env.jwt_secret) as {
      data: UserModel
      iat: number
      exp: number
    }
    return decoded.data
  },

  setRequestUser(reply: FastifyReply, user: UserModel) {
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        data: user,
      },
      env.jwt_secret
    )

    reply.setCookie("token", token, {
      ...cookieSettings,
      httpOnly: true,
    })
  },

  async getByProviderId(
    provider: AuthProvider,
    providerId: string
  ): Promise<UserAuthModel | undefined> {
    try {
      return (
        await db
          .select()
          .from(userAuths)
          .where(
            and(
              eq(userAuths.provider, provider),
              eq(userAuths.providerId, providerId)
            )
          )
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async upsert(
    userAuth: UserAuthInsertModel
  ): Promise<UserAuthModel | undefined> {
    try {
      if (!userAuth.id) {
        return (await db.insert(userAuths).values(userAuth).returning()).at(0)
      }
      return (
        await db
          .update(userAuths)
          .set(userAuth)
          .where(eq(userAuths.id, userAuth.id))
          .returning()
      ).at(0)
    } catch (error) {
      console.error(error)
    }
  },

  async getProviderToken(
    provider: AuthProvider,
    app: FastifyInstance,
    req: FastifyRequest
  ) {
    try {
      switch (provider) {
        case AuthProvider.Google:
          return (
            await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req)
          ).token.access_token
        case AuthProvider.Github:
          return (
            await app.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req)
          ).token.access_token
        default:
          throw `Unsupported Auth Provider "${provider}"`
      }
    } catch (error) {
      console.error(error)
      return
    }
  },

  async loadProviderData<T extends AuthProvider>(
    provider: T,
    token: string
  ): Promise<ProviderInfo<T> | undefined> {
    try {
      let url
      switch (provider) {
        case AuthProvider.Google:
          url = "https://www.googleapis.com/oauth2/v2/userinfo"
          break
        case AuthProvider.Github:
          url = "https://api.github.com/user"
          break
        default:
          throw `Unsupported Auth Provider "${provider}"`
      }

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      })
      if (!res.ok) return

      return res.json() as Promise<ProviderInfo<T>>
    } catch (error) {
      console.error(error)
      return
    }
  },

  normalizeProviderData(
    provider: AuthProvider,
    info: ProviderInfo<AuthProvider>
  ) {
    switch (provider) {
      case AuthProvider.Google: {
        const { name, picture, id, email } =
          info as ProviderInfo<AuthProvider.Google>
        return { name, picture, providerId: id, email }
      }
      case AuthProvider.Github: {
        const { login, avatar_url, id, email } =
          info as ProviderInfo<AuthProvider.Github>
        return { name: login, picture: avatar_url, providerId: id, email }
      }
      default:
        throw `Unsupported Auth Provider "${provider}"`
    }
  },
}
