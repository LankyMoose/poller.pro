import { UserModel } from "./drizzle/tables"

export type PublicUser = Omit<UserModel, "id">
