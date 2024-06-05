import { useEffect, useState } from "kaioken"
import { Spinner } from "$/components/atoms/Spinner"
import { usePageContext } from "$/context/pageContext"
import { usePollStore } from "$/stores/pollStore"
import { PlusIcon } from "$/components/icons/PlusIcon"
import { Button } from "$/components/atoms/Button"
import { Modal } from "$/components/modal/Modal"
import { NewPollForm } from "$/components/forms/NewPollForm"
import { useAuthModal } from "$/stores/authModalStore"
import { PollCard } from "$/components/PollCard"

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
    <div className="flex gap-4 items-start flex-wrap w-full max-w-[540px] mx-auto">
      {polls.length === 0 && (
        <p className="text-center">
          No polls yet. Add one with the button above ☝️
        </p>
      )}
      {polls.map((poll) => (
        // @ts-ignore
        <PollCard key={poll.id} id={poll.id} />
      ))}
    </div>
  )
}
