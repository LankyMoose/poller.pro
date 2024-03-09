import { UserAuth } from "./UserAuth"

export function Navbar() {
  return (
    <nav className="flex gap-4 p-4 w-full">
      <a className="text-sm underline" href="/">
        poller.pro
      </a>
      <UserAuth />
    </nav>
  )
}
