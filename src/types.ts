export type WebsocketServerMessage =
  | { type: "+polls"; count: number }
  | { type: "-poll"; id: number }
  | {
      type: "~voteCounts"
      pollId: number
      votes: { id: number; count: number }[]
    }
  | { type: "ping" }

export type WebsocketClientMessage =
  | { type: "+sub"; id: number }
  | { type: "-sub"; id: number }
  | { type: "ping" }

export enum AuthProvider {
  Google = "google",
  Github = "github",
}

export type PollWithMeta = {
  id: number
  text: string
  createdAt: number
  closed: boolean | null
  user: {
    id: number
    avatarUrl: string | null
    name: string
  }
  pollOptions: {
    id: number
    text: string
    count: number
  }[]
  userVote: number | null
}
