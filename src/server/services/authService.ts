// AuthCallbackState can be whichever parameters you want
// to persist throughout the OAuth process, eg:
// export type AuthCallbackState = {
//   post?: string
//   community?: string
//   newpost?: true
//   newcommunity?: true
// }

import { UserAuthInsertModel, UserAuthModel, userAuths } from "$/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { db } from "./db"
import { FastifyInstance, FastifyRequest } from "fastify"

export type AuthCallbackState = Record<string, unknown>

export enum AuthProvider {
  Google = "google",
  Github = "github",
}

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

        default:
          throw "Unsupported Auth Provider"
      }
    } catch (error) {
      console.error(error)
      return
    }
  },

  async loadProviderData<T extends AuthProvider>(
    provider: T,
    reqOrToken: FastifyRequest | string
  ): Promise<ProviderInfo<T> | undefined> {
    try {
      const tkn =
        typeof reqOrToken === "string"
          ? reqOrToken
          : reqOrToken.cookies["access_token"]
      if (!tkn) return

      let url
      switch (provider) {
        case AuthProvider.Google:
          url = "https://www.googleapis.com/oauth2/v2/userinfo"
          break
        case AuthProvider.Github:
          url = "https://api.github.com/user"
        default:
          throw "Unsupported Auth Provider"
      }

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + tkn,
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
        throw "Unsupported Auth Provider"
    }
  },
}
