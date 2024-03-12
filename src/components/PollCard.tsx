import { useState, useEffect } from "kaioken"
import { usePageContext } from "$/context/pageContext"
import { PollVoteScheme } from "$/models"
import type { PollWithMeta } from "$/server/services/pollService"
import { useAuthModal } from "$/stores/authModalStore"
import { usePollStore } from "$/stores/pollStore"
import { Avatar } from "./Avatar"
import { PollOptionButton } from "./PollOptionButton"
import { Button } from "./atoms/Button"
import { UTC } from "$/utils"
import "./PollCard.css"

export function PollCard({ id, numPolls }: { id: number; numPolls: number }) {
  const [isVoting, setIsVoting] = useState(false)
  const { setOpen } = useAuthModal()
  const { user } = usePageContext()
  const {
    value: poll,
    deletePoll,
    updatePoll,
  } = usePollStore((state) => state.polls.find((p) => p.id === id))

  useEffect(() => {
    if (!poll || !user) return
    window.liveSocket.send({ type: "+sub", id: poll.id })
    return () => window.liveSocket.send({ type: "-sub", id: poll.id })
  }, [])

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this poll?")) return
    try {
      const res = await fetch(`/api/polls/${id}`, { method: "DELETE" })
      if (res.ok) {
        deletePoll(id)
      }
    } catch (error) {
      console.error("handleDelete err", error)
    }
  }

  async function handleVote(pollOptionId: number) {
    if (!user) {
      return setOpen(true)
    }
    setIsVoting(true)
    const _poll = poll as PollWithMeta
    try {
      const payload: PollVoteScheme = { pollOptionId }
      const res = await fetch(`/api/polls/${id}/vote`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error(res.statusText)

      updatePoll({
        id: _poll.id,
        userVote: pollOptionId,
      })
    } catch (error) {
      console.error("handleVote err", error)
    } finally {
      setIsVoting(false)
    }
  }

  if (!poll) return null

  const totalVotes = poll.pollOptions.reduce((a, b) => a + b.count, 0)
  const percentages = poll.pollOptions.map((o) => ({
    id: o.id,
    percentage: o.count === 0 ? 0 : Math.round((o.count / totalVotes) * 100),
  }))

  return (
    <div
      className={`border p-2 rounded w-full ${numPolls > 1 ? "sm:w-[calc(50%-0.5rem)]" : ""} h-fit bg-neutral-800`}
    >
      <h4 className="font-bold mb-2 flex items-center justify-between ">
        <span>{poll.text}</span>
        <div className="flex flex-col justify-end">
          <small className="text-nowrap text-xs text-neutral-300">
            ({totalVotes} votes)
          </small>
          {(user?.isAdmin || user?.id === poll.user.id) && (
            <Button
              variant="link"
              className="text-red-500 py-0 pr-0"
              onclick={handleDelete}
            >
              Delete
            </Button>
          )}
        </div>
      </h4>
      <hr className="my-2" />
      <ul className="flex gap-2 flex-col mb-2">
        {poll.pollOptions.map((o) => (
          <li className="flex">
            <PollOptionButton
              option={o}
              percentage={
                percentages.find((p) => p.id === o.id)?.percentage || 0
              }
              userVote={poll.userVote}
              handleVote={handleVote}
              isVoting={isVoting}
            />
          </li>
        ))}
      </ul>
      <hr className="my-2" />
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-2">
          <Avatar url={poll.user.avatarUrl} size={18} />
          {poll.user.name}
        </span>
        <span className="text-neutral-500 flex items-center">
          {UTC.toLocaleString(poll.createdAt)}
        </span>
      </div>
    </div>
  )
}
