import { SocketStream } from "@fastify/websocket"
import { WebsocketClientMessage, WebsocketServerMessage } from "$/types"
import { FastifyRequest } from "fastify"

type PollID = string
type UserID = number

export const socketService = {
  connections: new WeakSet<SocketStream>(),
  pollSubscriptions: {} as Record<PollID, [UserID, SocketStream][]>,

  createPollSubscriptionSet(pollId: PollID) {
    if (this.pollSubscriptions[pollId]) return
    this.pollSubscriptions[pollId] = []
  },

  deletePollSubscriptionSet(pollId: PollID) {
    delete this.pollSubscriptions[pollId]
  },

  broadcastUpdate<T extends WebsocketServerMessage>(
    pollId: PollID,
    message: T,
    mutator?: (userId: number, msg: T) => T
  ) {
    const clients = this.pollSubscriptions[pollId] ?? []
    try {
      clients.forEach((client) => {
        const [userId, conn] = client
        if (conn.socket.readyState !== 1) {
          return console.error(
            "[SocketService]: ws conn not open",
            conn.socket.readyState
          )
        }
        const msg = mutator ? mutator(userId, message) : message
        conn.socket.send(JSON.stringify(msg))
      })
    } catch (error) {
      console.error("[SocketService]: broadcastUpdate error", error)
    }
  },

  handleDisconnect(conn: SocketStream) {
    this.connections.delete(conn)
    Object.keys(this.pollSubscriptions).forEach((pollId) => {
      this.pollSubscriptions[pollId] = this.pollSubscriptions[pollId].filter(
        ([_, c]) => c !== conn
      )
    })
  },

  handleConnection(conn: SocketStream, req: FastifyRequest) {
    if (!req.cookies["user"]) return

    const user = JSON.parse(req.cookies["user"])

    this.connections.add(conn)

    conn.setEncoding("utf8")
    conn.on("data", (chunk) => {
      const data = JSON.parse(chunk) as WebsocketClientMessage
      switch (data.type) {
        case "+sub":
          if (!this.pollSubscriptions[data.id]) return
          if (this.pollSubscriptions[data.id].find(([id]) => id === user.id))
            return
          this.pollSubscriptions[data.id].push([user.id, conn])
          break
        case "-sub":
          if (!this.pollSubscriptions[data.id]) return
          this.pollSubscriptions[data.id] = this.pollSubscriptions[
            data.id
          ].filter(([id]) => id !== user.id)
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
