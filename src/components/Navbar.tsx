import { UserAuth } from "./UserAuth"

export function Navbar() {
  return (
    <nav className="w-full flex justify-between gap-4 p-4 ">
      <a className="text-sm underline" href="/">
        poller.pro
      </a>
      <UserAuth />
    </nav>
  )
}
