import { useState, useModel } from "kaioken"
import { Button } from "../atoms/Button"
import { MinusIcon } from "../icons/MinusIcon"
import { Input } from "../atoms/Input"
import { PlusIcon } from "../icons/PlusIcon"
import { PollFormScheme, pollFormReqs, pollFormScheme } from "$/models"
import { usePollStore } from "$/stores/pollStore"
import { PollWithMeta } from "$/server/services/pollService"
import { CircleTickIcon } from "../icons/CircleTickIcon"
import { CircleAlertIcon } from "../icons/CircleAlertIcon"

export function NewPollForm({ close }: { close: () => void }) {
  const { addPoll } = usePollStore.methods
  const [submitting, setSubmitting] = useState(false)
  const [titleInputRef, titleInputValue] = useModel<HTMLInputElement, string>(
    ""
  )
  const [options, setOptions] = useState<string[]>(["", ""])

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

  function addOption() {
    setOptions([...options, ""])
  }

  const titleValid = pollFormReqs.text.validate(titleInputValue)
  const optionsLengthValid = pollFormReqs.options.validate(options)

  return (
    <div>
      <div className="mb-2">
        <Input
          minLength={pollFormReqs.text.min}
          maxLength={pollFormReqs.text.max}
          ref={titleInputRef}
          value={titleInputValue}
          type="text"
          placeholder="Text"
        />
        {!titleValid && (
          <small className="text-red-500 text-xs">
            {titleInputValue.length > pollFormReqs.text.max
              ? `Enter at most ${pollFormReqs.text.max} characters`
              : `Enter at least ${pollFormReqs.text.min} characters`}
          </small>
        )}
      </div>

      <div className="mb-2 p-2 border">
        <h5 className="font-bold text-xs">options</h5>
        <hr className="my-2" />
        <div>
          <div className="mb-2">
            <div className="flex flex-col gap-2 mt-2">
              {options.map((o, i) => (
                <div className="border bg-neutral-100 dark:bg-neutral-800 relative rounded flex justify-between items-center">
                  <Input
                    minLength={pollFormReqs.optionText.min}
                    maxLength={pollFormReqs.optionText.max}
                    className="bg-black bg-opacity-15 border-0 pr-8"
                    value={o}
                    oninput={(e) => {
                      setOptions(
                        options.map((x, j) => (i === j ? e.target.value : x))
                      )
                    }}
                    type="text"
                    placeholder="Option"
                  />
                  <div className="absolute right-0 flex items-center">
                    {i > 1 && (
                      <button
                        className="p-1"
                        onclick={() =>
                          setOptions(options.filter((_, idx) => idx !== i))
                        }
                      >
                        <MinusIcon />
                      </button>
                    )}
                    <div className="pr-2">
                      {pollFormReqs.optionText.validate(options, o) ? (
                        <span className="text-green-500">
                          <CircleTickIcon width={"1em"} height={"1em"} />
                        </span>
                      ) : (
                        <span
                          className="text-red-500"
                          title={!o.length ? "Required" : "Not unique"}
                        >
                          <CircleAlertIcon width={"1em"} height={"1em"} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Button
              disabled={!optionsLengthValid}
              onclick={addOption}
              className="text-nowrap text-xs flex gap-2 w-full items-center justify-center"
            >
              <PlusIcon width={"1em"} height={".8em"} />
              <span style="line-height: 0">Add Option</span>
            </Button>
          </div>
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
