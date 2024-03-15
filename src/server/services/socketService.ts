import { SocketStream } from "@fastify/websocket"
import { WebsocketClientMessage, WebsocketServerMessage } from "$/types"

type PollID = string

export const socketService = {
  connections: new WeakSet<SocketStream>(),
  pollSubscriptions: {} as Record<PollID, SocketStream[]>,

  createPollSubscriptionSet(pollId: PollID) {
    if (this.pollSubscriptions[pollId]) return
    this.pollSubscriptions[pollId] = []
  },

  deletePollSubscriptionSet(pollId: PollID) {
    delete this.pollSubscriptions[pollId]
  },

  broadcastUpdate(pollId: PollID, message: WebsocketServerMessage) {
    const clients = this.pollSubscriptions[pollId] ?? []
    try {
      clients.forEach((conn) => {
        if (conn.socket.readyState !== 1) {
          return console.error(
            "[SocketService]: ws conn not open",
            conn.socket.readyState
          )
        }
        conn.socket.send(JSON.stringify(message))
      })
    } catch (error) {
      console.error("[SocketService]: broadcastUpdate error", error)
    }
  },

  handleDisconnect(conn: SocketStream) {
    this.connections.delete(conn)
    Object.keys(this.pollSubscriptions).forEach((pollId) => {
      this.pollSubscriptions[pollId] = this.pollSubscriptions[pollId].filter(
        (c) => c !== conn
      )
    })
  },

  handleConnection(conn: SocketStream) {
    this.connections.add(conn)
    conn.setEncoding("utf8")
    conn.on("data", (chunk) => {
      const data = JSON.parse(chunk) as WebsocketClientMessage
      switch (data.type) {
        case "+sub":
          this.pollSubscriptions[data.id]?.push(conn)
          break
        case "-sub":
          if (!this.pollSubscriptions[data.id]) return
          this.pollSubscriptions[data.id] = this.pollSubscriptions[
            data.id
          ].filter((c) => c !== conn)
          break
        default:
      }
    })
    conn.on("close", () => this.handleDisconnect(conn))
    conn.on("end", () => this.handleDisconnect(conn))
    conn.on("error", (err) => {
      console.error("[SocketService]: websocket error", err)
      this.handleDisconnect(conn)
    })
  },
}
