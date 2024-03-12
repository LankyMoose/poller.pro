import { z } from "zod"

export const pollIdScheme = z.object({ id: z.number({ coerce: true }) })

export const pollFormReqs = {
  text: {
    min: 4,
    max: 100,
    validate: function (text: string) {
      return text.length >= this.min && text.length <= this.max
    },
  },
  options: {
    min: 2,
    max: 8,
    validate: function (options: string[]) {
      return options.length >= this.min && options.length <= this.max
    },
  },
  optionText: {
    min: 1,
    max: 32,
    validate: function (options: string[], text: string) {
      return (
        text.length >= this.min &&
        text.length <= this.max &&
        options.filter((o) => o === text).length < 2
      )
    },
  },
} as const

export const pollFormScheme = z.object({
  text: z.string().min(pollFormReqs.text.min).max(pollFormReqs.text.max),
  options: z
    .array(
      z
        .string()
        .min(pollFormReqs.optionText.min)
        .max(pollFormReqs.optionText.max)
    )
    .min(pollFormReqs.options.min)
    .max(pollFormReqs.options.max)
    .superRefine((options, ctx) => {
      // ensure each option is unique
      if (new Set(options).size !== options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Options must be unique",
        })
      }
    }),
})

export type PollFormScheme = z.infer<typeof pollFormScheme>

export const pollVoteScheme = z.object({ pollOptionId: z.number() })
export type PollVoteScheme = z.infer<typeof pollVoteScheme>
