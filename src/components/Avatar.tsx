import { ElementProps } from "kaioken"
import { UserIcon } from "./icons/UserIcon"

export function Avatar({
  url,
  size = 50,
  className,
}: { url: string | null; size?: number } & ElementProps<"div">) {
  return (
    <div
      className={`flex rounded-full overflow-hidden border border-neutral-800 dark:border-neutral-200 bg-neutral-200 dark:bg-neutral-700 w-fit ${className || ""}`}
    >
      {url ? (
        <img src={url} width={size} height={size} />
      ) : (
        <UserIcon width={size} height={size} className="p-1" />
      )}
    </div>
  )
}
