import type { PollWithMetaList } from "$/server/services/pollService"
import { createStore } from "kaioken"

export const usePollStore = createStore(
  {
    polls: [] as PollWithMetaList,
  },
  (set) => ({
    setPolls: (polls: PollWithMetaList) =>
      set((state) => ({ ...state, polls })),
    addPoll: (poll: PollWithMetaList[number]) =>
      set((state) => ({ ...state, polls: [...state.polls, poll] })),
    deletePoll: (id: number) =>
      set((state) => ({
        ...state,
        polls: state.polls.filter((p) => p.id !== id),
      })),
  })
)
