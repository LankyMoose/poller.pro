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

export { Page }

function Page() {
  const [addPollOpen, setAddPollOpen] = useState(false)
  return (
    <div className="w-full h-full flex-grow flex flex-col items-center justify-center">
      <div>
        <Button
          onclick={() => setAddPollOpen(true)}
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
      <div className="flex-grow flex flex-col h-full w-full items-center justify-center">
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

  if (loading) return <Spinner />

  return (
    <>
      {polls.length === 0 && (
        <p className="text-center">
          No polls yet. Add one with the button above ☝️
        </p>
      )}
      {polls.map((poll) => (
        <PollCard id={poll.id} />
      ))}
    </>
  )
}

function PollCard({ id }: { id: number }) {
  const [isVoting, setIsVoting] = useState(false)
  const { setOpen } = useAuthModal()
  const { user } = usePageContext()
  const {
    value: poll,
    deletePoll,
    updatePoll,
  } = usePollStore((state) => state.polls.find((p) => p.id === id))

  if (!poll) return null

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
      let prevVote = _poll.userVote

      const pollOptions = _poll.pollOptions.map((v) =>
        v.id === pollOptionId
          ? { ...v, count: v.count + 1 }
          : v.id === prevVote
            ? { ...v, count: v.count - 1 }
            : v
      )

      updatePoll({
        ..._poll,
        userVote: pollOptionId,
        pollOptions,
      })
    } catch (error) {
      console.error("handleVote err", error)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="border p-2 m-2 rounded w-full sm:w-1/2 bg-neutral-100 dark:bg-neutral-800">
      <h4 className="font-bold mb-2 flex items-center justify-between ">
        {poll.text}{" "}
        {(user?.isAdmin || user?.id === poll.user.id) && (
          <Button
            variant="link"
            className="text-red-500"
            onclick={handleDelete}
          >
            Delete
          </Button>
        )}
      </h4>
      <hr className="my-2" />
      <ul className="flex gap-2 flex-col mb-2">
        {poll.pollOptions.map((o) => (
          <li className="flex">
            <button
              className="w-full p-2 rounded bg-primary flex justify-between items-center text-white"
              disabled={poll.userVote === o.id || isVoting}
              onclick={() => handleVote(o.id)}
            >
              {o.text}
              {poll.userVote === o.id && <CircleTickIcon />}
              <span>{o.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
