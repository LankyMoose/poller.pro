import { usePollStore } from "./stores/pollStore"
import { WebsocketClientMessage, WebsocketServerMessage } from "./types"

export class LiveSocket {
  socket: WebSocket
  pendingMessages: WebsocketClientMessage[] = []

  constructor(url: string) {
    this.socket = new WebSocket(url)
    this.socket.onmessage = (msg: any) => {
      try {
        const data = JSON.parse(msg.data)
        if (!("type" in data)) throw new Error("received invalid message")
        this.handleMessage(data)
      } catch (error) {
        console.error(error)
      }
    }
    this.socket.onopen = () => {
      while (this.pendingMessages.length)
        this.send(this.pendingMessages.shift()!)
    }
  }

  send(message: WebsocketClientMessage) {
    if (this.socket.readyState !== this.socket.OPEN) {
      this.pendingMessages.push(message)
      return
    }
    this.socket.send(JSON.stringify(message))
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

        usePollStore.methods.updatePoll({ id: poll.id, pollOptions })
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
