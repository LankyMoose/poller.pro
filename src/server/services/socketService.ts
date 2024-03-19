import { SocketStream } from "@fastify/websocket"
import { WebsocketClientMessage, WebsocketServerMessage } from "$/types"
import { FastifyRequest } from "fastify"

type PollID = string
type UserID = number

export const socketService = {
  connections: new WeakSet<SocketStream>(),
  pollSubscriptions: {} as Record<PollID, [UserID, SocketStream[]][]>,

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
        const [userId, conns] = client
        const msg = mutator ? mutator(userId, message) : message

        conns.forEach((conn) => {
          if (conn.socket.readyState !== 1) return
          conn.socket.send(JSON.stringify(msg))
        })
      })
    } catch (error) {
      console.error("[SocketService]: broadcastUpdate error", error)
    }
  },

  handleDisconnect(userId: UserID, conn: SocketStream) {
    this.connections.delete(conn)
    Object.keys(this.pollSubscriptions).forEach((pollId) => {
      this.pollSubscriptions[pollId].forEach(([id, conns]) => {
        if (id !== userId) return
        conns.splice(conns.indexOf(conn), 1)
      })
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
          const match = this.pollSubscriptions[data.id].find(
            ([id]) => id === user.id
          )
          if (match) {
            if (!match[1].includes(conn)) match[1].push(conn)
            return
          }
          this.pollSubscriptions[data.id].push([user.id, [conn]])
          break
        case "-sub":
          const collection = this.pollSubscriptions[data.id]
          if (!collection) return

          collection.forEach(([id, conns]) => {
            if (id !== user.id) return
            conns.splice(conns.indexOf(conn), 1)
          })

          break
        default:
      }
    })
    conn.on("close", () => this.handleDisconnect(user.id, conn))
    conn.on("end", () => this.handleDisconnect(user.id, conn))
    conn.on("error", (err) => {
      console.error("[SocketService]: websocket error", err)
      this.handleDisconnect(user.id, conn)
    })
  },
}
