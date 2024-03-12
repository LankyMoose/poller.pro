import type { PollWithMeta } from "$/types"
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
    updatePoll: (poll: Partial<PollWithMeta> & { id: number }) =>
      set((state) => ({
        ...state,
        polls: state.polls.map((p) =>
          p.id === poll.id ? { ...p, ...poll } : p
        ),
      })),
  })
)
