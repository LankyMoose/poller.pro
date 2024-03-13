import { ElementProps } from "kaioken"
import { UserIcon } from "./icons/UserIcon"

export function Avatar({
  url,
  size = 50,
  className,
  alt = "avatar",
}: { url: string | null; size?: number; alt?: string } & ElementProps<"div">) {
  return (
    <div
      className={`flex rounded-full overflow-hidden border border-neutral-200 bg-neutral-700 w-fit ${className || ""}`}
    >
      {url ? (
        <img src={url} width={size} height={size} alt={alt} />
      ) : (
        <UserIcon width={size} height={size} className="p-1" />
      )}
    </div>
  )
}
