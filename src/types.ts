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
