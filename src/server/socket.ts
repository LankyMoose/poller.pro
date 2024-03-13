import { SocketStream } from "@fastify/websocket"
import { WebsocketClientMessage, WebsocketServerMessage } from "$/types"

type PollID = string

const connections: WeakSet<SocketStream> = new WeakSet()
const pollSubscriptions: Record<PollID, SocketStream[]> = {}

// every 5 min, check for pollSubscriptions that are empty and remove them
setInterval(clearEmptyPollSubscriptions, 1000 * 60 * 5)
function clearEmptyPollSubscriptions() {
  Object.entries(pollSubscriptions).forEach(([id, arr]) => {
    if (arr.length === 0) {
      delete pollSubscriptions[id]
    }
  })
}

export const createPollSubscriptionSet = (pollId: PollID) =>
  (pollSubscriptions[pollId] = [])

export const broadcastUpdate = (
  pollId: PollID,
  message: WebsocketServerMessage
) => {
  const clients = pollSubscriptions[pollId] ?? []
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
  Object.keys(pollSubscriptions).forEach((pollId) => {
    pollSubscriptions[pollId] = pollSubscriptions[pollId].filter(
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
        const s = pollSubscriptions[data.id]
        if (!s) {
          pollSubscriptions[data.id] = [conn]
        } else {
          s.push(conn)
        }
        break
      case "-sub":
        if (!pollSubscriptions[data.id]) return
        pollSubscriptions[data.id] = pollSubscriptions[data.id].filter(
          (c) => c !== conn
        )
        break
      default:
    }
  })
  conn.on("close", () => handleDisconnect(conn))
  conn.on("end", () => handleDisconnect(conn))
  conn.on("error", () => handleDisconnect(conn))
}
