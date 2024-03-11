import type { PollWithMeta } from "$/server/services/pollService"
import { createStore } from "kaioken"

export const usePollStore = createStore(
  {
    polls: [] as PollWithMeta[],
  },
  (set) => ({
    setPolls: (polls: PollWithMeta[]) => set((state) => ({ ...state, polls })),
    addPoll: (poll: PollWithMeta) =>
      set((state) => ({ ...state, polls: [poll, ...state.polls] })),
    deletePoll: (id: number) =>
      set((state) => ({
        ...state,
        polls: state.polls.filter((p) => p.id !== id),
      })),
    updatePoll: (poll: PollWithMeta) =>
      set((state) => ({
        ...state,
        polls: state.polls.map((p) => (p.id === poll.id ? poll : p)),
      })),
  })
)
