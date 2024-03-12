import type { PollWithMeta } from "$/server/services/pollService"
import { CircleTickIcon } from "./icons/CircleTickIcon"

export function PollOptionButton({
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
