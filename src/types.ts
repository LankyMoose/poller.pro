export type WebsocketMessage =
  | { type: "+polls"; count: number }
  | { type: "-poll"; id: number }
  | {
      type: "~voteCounts"
      pollId: number
      votes: { id: number; count: number }[]
    }
  | { type: "ping" }
