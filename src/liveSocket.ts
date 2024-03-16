import { usePollStore } from "./stores/pollStore"
import { WebsocketClientMessage, WebsocketServerMessage } from "./types"

export class LiveSocket {
  private maxRetries = 10
  private retryDelay = 1000
  private socket: WebSocket
  private pendingMessages: WebsocketClientMessage[] = []

  constructor(private url: string) {
    this.socket = this.createSocket()
  }

  send(message: WebsocketClientMessage) {
    if (this.socket.readyState !== 1) {
      this.pendingMessages.push(message)
      return
    }
    this.socket.send(JSON.stringify(message))
  }

  private createSocket() {
    const socket = new WebSocket(this.url)
    socket.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data)
        if (!("type" in data)) throw new Error("received invalid message")
        this.handleMessage(data)
      } catch (error) {
        console.error(error)
      }
    }
    socket.onopen = () => {
      while (this.pendingMessages.length)
        this.send(this.pendingMessages.shift()!)
    }
    socket.onclose = () => {
      setTimeout(() => {
        if (this.maxRetries-- > 0) {
          this.socket = this.createSocket()
        }
      }, this.retryDelay)
    }
    return socket
  }

  private handleMessage(message: WebsocketServerMessage) {
    switch (message.type) {
      case "+polls":
        break
      case "~voteCounts":
        const poll = usePollStore
          .getState()
          .polls.find((p) => p.id === message.pollId)
        if (!poll) return

        const pollOptions = poll.pollOptions.map((v) => {
          const newVotes = message.votes.find((vote) => vote.id === v.id)
          return {
            ...v,
            count: newVotes ? newVotes.count : 0,
          }
        })

        const userVote = message.userVote ?? poll.userVote

        usePollStore.methods.updatePoll({
          id: poll.id,
          pollOptions,
          userVote,
        })
        break

      case "-poll":
        usePollStore.methods.deletePoll(message.id)
        break

      default:
        return
    }
  }
}

export const createLiveSocket = () => {
  const { hostname, port } = window.location
  const protocol = window.location.protocol === "https:" ? "wss" : "ws"
  return new LiveSocket(`${protocol}://${hostname}:${port}/ws`)
}
