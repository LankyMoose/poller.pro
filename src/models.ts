import { z } from "zod"

export const pollIdScheme = z.object({ id: z.number() })

export const pollFormScheme = z.object({
  text: z.string().min(4).max(100),
  options: z.array(z.string().min(1).max(32)),
})

export type PollFormScheme = z.infer<typeof pollFormScheme>
