import { SocketStream } from "@fastify/websocket"
import { WebsocketClientMessage, WebsocketServerMessage } from "$/types"

type PollID = string

const connections: WeakSet<SocketStream> = new WeakSet()
const pollSubscriptions: Record<PollID, Set<SocketStream>> = {}

// every 5 min, check for pollSubscriptions that are empty and remove them
setInterval(clearEmptyPollSubscriptions, 1000 * 60 * 5)
function clearEmptyPollSubscriptions() {
  Object.entries(pollSubscriptions).forEach(([id, set]) => {
    if (set.size === 0) {
      delete pollSubscriptions[id]
    }
  })
}

export const createPollSubscriptionSet = (pollId: PollID) =>
  (pollSubscriptions[pollId] = new Set())

export const broadcastUpdate = (
  pollId: PollID,
  message: WebsocketServerMessage
) => {
  const clients = pollSubscriptions[pollId]
  try {
    clients?.forEach((conn) => {
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
  Object.values(pollSubscriptions).forEach((set) => set.delete(conn))
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
        pollSubscriptions[data.id]?.add(conn)
        break
      case "-sub":
        pollSubscriptions[data.id]?.delete(conn)
        break
      default:
    }
  })
  conn.on("close", () => handleDisconnect(conn))
  conn.on("end", () => handleDisconnect(conn))
  conn.on("error", () => handleDisconnect(conn))
}
