import { ElementProps } from "kaioken"

export const PlusIcon = (props: ElementProps<"svg">) => {
  const { width, height, ...rest } = props
  return (
    <svg
      width={width ?? "1rem"}
      height={height ?? "1rem"}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      {...rest}
    >
      <path
        fill={"currentColor"}
        fill-rule="evenodd"
        d="M9 17a1 1 0 102 0v-6h6a1 1 0 100-2h-6V3a1 1 0 10-2 0v6H3a1 1 0 000 2h6v6z"
      />
    </svg>
  )
}
