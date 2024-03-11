import type { PollWithMeta } from "$/server/services/pollService"
import { createStore } from "kaioken"

export const usePollStore = createStore(
  {
    polls: [] as PollWithMeta[],
  },
  (set) => ({
    setPolls: (polls: PollWithMeta[]) => set((state) => ({ ...state, polls })),
    addPoll: (poll: PollWithMeta) =>
      set((state) => ({ ...state, polls: [...state.polls, poll] })),
    deletePoll: (id: number) =>
      set((state) => ({
        ...state,
        polls: state.polls.filter((p) => p.id !== id),
      })),
  })
)
