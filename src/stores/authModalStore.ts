import { createStore } from "kaioken"

export const useAuthModal = createStore({ open: false }, (set) => ({
  setOpen: (value: boolean) => set({ open: value }),
}))
