import { ElementProps } from "kaioken"

export function Input({ className = "", ...props }: ElementProps<"input">) {
  return (
    <input
      className={`border w-full rounded px-2 py-1 ${className}`}
      {...props}
    />
  )
}
