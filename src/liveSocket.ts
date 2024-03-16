import { usePollStore } from "./stores/pollStore"
import { WebsocketClientMessage, WebsocketServerMessage } from "./types"

export class LiveSocket {
  private retryDelay = 5000
  private socket: WebSocket | null = null
  private pendingMessages: WebsocketClientMessage[] = []
  private connecting = false

  constructor(private url: string) {
    this.createSocket()
  }

  send(message: WebsocketClientMessage) {
    if (this.socket?.readyState !== 1) {
      this.pendingMessages.push(message)
      return
    }
    this.socket.send(JSON.stringify(message))
  }

  private createSocket() {
    this.connecting = true
    try {
      this.socket = new WebSocket(this.url)
      this.socket.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          if (!("type" in data)) throw new Error("received invalid message")
          this.handleMessage(data)
        } catch (error) {
          console.error(error)
        }
      }
      this.socket.onopen = () => {
        this.connecting = false
        while (this.pendingMessages.length)
          this.send(this.pendingMessages.shift()!)
      }
      this.socket.onclose = this.reconnect.bind(this)
      this.socket.onerror = this.reconnect.bind(this)
    } catch (error) {
      console.error(error)
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.connecting) return
    if (this.socket?.readyState === 1) return

    this.connecting = true
    setTimeout(() => {
      if (this.socket?.readyState === 1) return
      this.createSocket()
    }, this.retryDelay)
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
