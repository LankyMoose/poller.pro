import { FastifyRequest } from "fastify"
import { SocketStream } from "@fastify/websocket"
import { WebsocketMessage } from "$/types"

type PollID = string
type AnonID = string

const pollSubscriptions: Record<PollID, AnonID[]> = {}

const userConns: Map<AnonID, SocketStream[]> = new Map()

export const subscribeToPolls = (req: FastifyRequest, pollIds: PollID[]) => {
  const anonId = req.cookies["user_anon_id"]
  if (!anonId) return

  pollIds.forEach((pollId) => {
    if (!pollSubscriptions[pollId]) {
      pollSubscriptions[pollId] = []
    }
    if (pollSubscriptions[pollId].includes(anonId)) return
    pollSubscriptions[pollId].push(anonId)
  })
}
function unsubscribeFromPolls(anonId: string) {
  Object.keys(pollSubscriptions).forEach((pollId) => {
    unsubscribeFromPoll(pollId, anonId)
  })
}

function unsubscribeFromPoll(pollId: PollID, anonId: string) {
  pollSubscriptions[pollId] = pollSubscriptions[pollId].filter(
    (id) => id !== anonId
  )
}

const addUserRef = (anonId: string, socket: SocketStream) => {
  const current = userConns.get(anonId) ?? []
  if (current.includes(socket)) return
  current.push(socket)
  userConns.set(anonId, current)
}
const removeUserRef = (anonId: string) => {
  const current = userConns.get(anonId) ?? []
  current.forEach((conn) => {
    conn.socket.close()
  })
  userConns.delete(anonId)
}

export const broadcastUpdate = (
  pollId: PollID,
  pollUpdateMessage: WebsocketMessage
) => {
  const anonIds = pollSubscriptions[pollId]
  if (!anonIds || anonIds.length === 0) return
  try {
    anonIds.forEach((id) => {
      const conns = userConns.get(id)
      if (!conns) return console.error("no conns for anon id", id)

      conns.forEach((conn) => {
        if (conn.socket.readyState !== 1) {
          return console.error("ws conn not open", conn.socket.readyState)
        }
        conn.socket.send(JSON.stringify(pollUpdateMessage))
      })
    })
  } catch (error) {
    console.error("broadcastUpdate error", error)
  }
}

export const socketHandler = (conn: SocketStream, req: FastifyRequest) => {
  const anonId = req.cookies["user_anon_id"]
  if (!anonId) return console.error("new ws req - no anon id")

  addUserRef(anonId, conn)

  conn.setEncoding("utf8")
  conn.on("data", (chunk) => {
    const data = JSON.parse(chunk)

    switch (data.type) {
      case "ping":
        conn.socket.send(JSON.stringify({ type: "ping" }))
        return
      default:
    }
  })
  conn.on("close", () => removeUserRef(anonId))
  conn.on("end", () => removeUserRef(anonId))
  conn.on("error", () => removeUserRef(anonId))
}
