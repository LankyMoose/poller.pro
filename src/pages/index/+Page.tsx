import { Spinner } from "$/components/atoms/Spinner"
import { usePageContext } from "$/context/pageContext"
import { usePollStore } from "$/stores/pollStore"
import { useEffect, useState } from "kaioken"
import { PlusIcon } from "$/components/icons/PlusIcon"
import { Button } from "$/components/atoms/Button"
import { Modal } from "$/components/modal/Modal"
import { NewPollForm } from "$/components/forms/NewPollForm"
import { PollVoteScheme } from "$/models"
import { PollWithMeta } from "$/server/services/pollService"
import { CircleTickIcon } from "$/components/icons/CircleTickIcon"
import { useAuthModal } from "$/stores/authModalStore"
import { Avatar } from "$/components/Avatar"
import "./PollCard.css"

export { Page }

function Page() {
  const { user } = usePageContext()
  const { setOpen } = useAuthModal()
  const [addPollOpen, setAddPollOpen] = useState(false)
  return (
    <div className="w-full h-full flex-grow flex flex-col items-center justify-center">
      <div className="mb-8">
        <Button
          onclick={() => (user ? setAddPollOpen(true) : setOpen(true))}
          className="flex gap-2 items-center"
        >
          Add poll
          <PlusIcon />
        </Button>
        <Modal open={addPollOpen} close={() => setAddPollOpen(false)}>
          <h4 className="text-lg font-bold text-center">Add poll</h4>
          <hr className="my-2" />
          <NewPollForm close={() => setAddPollOpen(false)} />
        </Modal>
      </div>
      <div className="flex-grow w-full min-h-full flex flex-col">
        <PollListDisplay />
      </div>
    </div>
  )
}

function PollListDisplay() {
  const [loading, setLoading] = useState(true)
  const { value: polls, setPolls } = usePollStore(
    (state) => state.polls,
    (prev, next) => prev.length === next.length
  )
  useEffect(() => {
    fetch("/api/polls")
      .then((res) => res.json())
      .then((data) => {
        setPolls(data)
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div className="flex flex-col flex-grow h-full items-center justify-center">
        <Spinner />
      </div>
    )

  return (
    <div className="flex gap-4 items-start flex-wrap w-full max-w-[760px] mx-auto">
      {polls.length === 0 && (
        <p className="text-center">
          No polls yet. Add one with the button above ☝️
        </p>
      )}
      {polls.map((poll) => (
        <PollCard id={poll.id} numPolls={polls.length} />
      ))}
    </div>
  )
}

function PollCard({ id, numPolls }: { id: number; numPolls: number }) {
  const [isVoting, setIsVoting] = useState(false)
  const { setOpen } = useAuthModal()
  const { user } = usePageContext()
  const {
    value: poll,
    deletePoll,
    updatePoll,
  } = usePollStore((state) => state.polls.find((p) => p.id === id))

  useEffect(() => {
    if (!poll) return
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
          {formatUTCDate(poll.createdAt)}
        </span>
      </div>
    </div>
  )
}

function PollOptionButton({
  option,
  percentage,
  userVote,
  handleVote,
  isVoting,
}: {
  option: PollWithMeta["pollOptions"][number]
  percentage: number
  userVote: number | null
  handleVote: (pollOptionId: number) => void
  isVoting: boolean
}) {
  const isSelected = userVote === option.id

  return (
    <button
      className={`w-full rounded border-2 ${isSelected ? "border-primary" : "border-primary-dark"} bg-black bg-opacity-15 relative poll-option`}
      disabled={isSelected || isVoting}
      onclick={() => handleVote(option.id)}
    >
      <div
        className={`absolute h-full ${isSelected ? "bg-primary" : "bg-primary-dark"} left-0 w-percent`}
        style={`--percent: ${userVote === null ? 100 : percentage}%`}
      />
      <div className="w-full p-2 flex justify-between items-center text-white relative z-10">
        {option.text}
        {userVote !== null && <span>{percentage}%</span>}
      </div>
      {isSelected && (
        <div className="absolute h-full w-full flex items-center justify-center pointer-events-none left-0 top-0">
          <CircleTickIcon />
        </div>
      )}
    </button>
  )
}

function formatUTCDate(date: number) {
  return new Date(date * 1000).toLocaleString()
}
