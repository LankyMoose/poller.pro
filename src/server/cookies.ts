import { CookieSerializeOptions } from "@fastify/cookie"
import { env } from "./env"

export const cookieSettings = {
  domain: env.domain || "localhost",
  path: "/",
  sameSite: "lax",
  secure: env.isProduction,
} satisfies CookieSerializeOptions
