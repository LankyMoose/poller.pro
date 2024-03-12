import { SocketStream } from "@fastify/websocket"
import { WebsocketClientMessage, WebsocketServerMessage } from "$/types"

type PollID = string

const connections: WeakSet<SocketStream> = new WeakSet()
const pollSubscriptions: Record<PollID, SocketStream[]> = {}

export const broadcastUpdate = (
  pollId: PollID,
  message: WebsocketServerMessage
) => {
  const clients = pollSubscriptions[pollId]
  if (!clients || !clients.length) return
  try {
    clients.forEach((conn) => {
      if (conn.socket.readyState !== 1) {
        return console.error("ws conn not open", conn.socket.readyState)
      }
      conn.socket.send(JSON.stringify(message))
    })
  } catch (error) {
    console.error("broadcastUpdate error", error)
  }
}

function handleDisconnect(conn: SocketStream) {
  connections.delete(conn)
  const pollIds = Object.keys(pollSubscriptions)
  pollIds.forEach((pollId) => {
    pollSubscriptions[pollId] = (pollSubscriptions[pollId] || []).filter(
      (c) => c !== conn
    )
  })
}

export const socketHandler = (conn: SocketStream) => {
  connections.add(conn)
  conn.setEncoding("utf8")
  conn.on("data", (chunk) => {
    const data = JSON.parse(chunk) as WebsocketClientMessage
    switch (data.type) {
      case "ping":
        conn.socket.send(JSON.stringify({ type: "ping" }))
        break
      case "+sub":
        if (!pollSubscriptions[data.id]) {
          pollSubscriptions[data.id] = []
        }
        pollSubscriptions[data.id].push(conn)
        break
      case "-sub":
        if (!pollSubscriptions[data.id]) return

        pollSubscriptions[data.id] = pollSubscriptions[data.id].filter(
          (c) => c !== conn
        )

      default:
    }
  })
  conn.on("close", () => handleDisconnect(conn))
  conn.on("end", () => handleDisconnect(conn))
  conn.on("error", () => handleDisconnect(conn))
}
