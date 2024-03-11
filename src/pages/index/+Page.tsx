import { Spinner } from "$/components/atoms/Spinner"
import { usePageContext } from "$/context/pageContext"
import { usePollStore } from "$/stores/pollStore"
import { useEffect, useState } from "kaioken"
import { PlusIcon } from "$/components/icons/PlusIcon"
import { Button } from "$/components/atoms/Button"
import { Modal } from "$/components/modal/Modal"
import { NewPollForm } from "$/components/forms/NewPollForm"

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
      <div className="flex-grow flex flex-col h-full items-center justify-center">
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
        console.log({ data })
        setPolls(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      {polls.length === 0 && (
        <p className="text-center">
          No polls yet. Add one with the button above ☝️
        </p>
      )}
      {polls.map((poll) => (
        <PollCard id={poll.id} />
      ))}
    </div>
  )
}

function PollCard({ id }: { id: number }) {
  const { user } = usePageContext()
  const { value: poll, deletePoll } = usePollStore((state) =>
    state.polls.find((p) => p.id === id)
  )
  if (!poll) return null

  async function handleDelete() {
    try {
      const res = await fetch(`/api/polls/${id}`, { method: "DELETE" })
      if (res.ok) {
        deletePoll(id)
      }
    } catch (error) {
      console.error("handleDelete err", error)
    }
  }

  return (
    <div>
      <h4>{poll.text}</h4>
      <ul>
        {poll.pollOptions.map((o) => (
          <li>{o.text}</li>
        ))}
      </ul>
      {(user?.isAdmin || user?.id === poll.user.id) && (
        <Button onclick={handleDelete}>Delete</Button>
      )}
    </div>
  )
}
