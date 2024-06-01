import envpls from "envpls"

export const env = envpls({
  server: {
    host: process.env.HOST || "localhost",
    port: Number(process.env.PORT || "5173"),
  },
  jwt_secret: process.env.JWT_SECRET,
  url: process.env.URL || "http://localhost:5173",
  domain: process.env.DOMAIN || "localhost",
  isProduction: process.env.NODE_ENV === "production",
  db: {
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  auth0: {
    google: {
      id: process.env.GOOGLE_AUTH0_CLIENT_ID,
      secret: process.env.GOOGLE_AUTH0_CLIENT_SECRET,
    },
    github: {
      id: process.env.GITHUB_AUTH0_CLIENT_ID,
      secret: process.env.GITHUB_AUTH0_CLIENT_SECRET,
    },
  },
})
