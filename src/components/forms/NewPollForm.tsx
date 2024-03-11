import { useState, useModel } from "kaioken"
import { Button } from "../atoms/Button"
import { MinusIcon } from "../icons/MinusIcon"
import { Input } from "../atoms/Input"
import { PlusIcon } from "../icons/PlusIcon"
import { PollFormScheme, pollFormScheme } from "$/models"
import { usePollStore } from "$/stores/pollStore"
import { PollWithMeta } from "$/server/services/pollService"

export function NewPollForm({ close }: { close: () => void }) {
  const { addPoll } = usePollStore.methods
  const [submitting, setSubmitting] = useState(false)
  const [titleInputRef, titleInputValue] = useModel<HTMLInputElement, string>(
    ""
  )
  const [newOptionInputRef, newOptionInputValue, setNewOptionInput] = useModel<
    HTMLInputElement,
    string
  >("")
  const [options, setOptions] = useState<string[]>([])

  const isValid = () =>
    pollFormScheme.safeParse({ text: titleInputValue, options }).success

  async function handleSubmit() {
    const payload: PollFormScheme = pollFormScheme.parse({
      text: titleInputValue,
      options,
    })
    setSubmitting(true)
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) throw new Error(res.statusText)
      const newPoll = (await res.json()) as PollWithMeta
      addPoll(newPoll)
      close()
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-2">
        <Input
          minLength={3}
          ref={titleInputRef}
          value={titleInputValue}
          type="text"
          placeholder="Text"
        />
      </div>

      <div className="mb-2 p-2 border">
        <h5 className="font-bold text-xs">options</h5>
        <hr className="my-2" />
        <div>
          <div className="flex items-center gap-2">
            <Input
              minLength={1}
              ref={newOptionInputRef}
              value={newOptionInputValue}
              type="text"
              placeholder="Option"
            />
            <Button
              disabled={
                !newOptionInputValue.length ||
                options.indexOf(newOptionInputValue) !== -1
              }
              onclick={() => {
                setNewOptionInput("")
                setOptions([...options, newOptionInputValue])
              }}
              className="text-nowrap text-xs"
            >
              <PlusIcon className="mx-2" />
            </Button>
          </div>
          {options.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {options.map((o) => (
                <div className="border bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded flex justify-between items-center">
                  {o}
                  <Button
                    variant="primary"
                    className="px-0 py-0"
                    onclick={() => setOptions(options.filter((x) => x !== o))}
                  >
                    <MinusIcon />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!isValid() || submitting}
          onclick={handleSubmit}
          variant="primary"
        >
          Add
        </Button>
      </div>
    </div>
  )
}
