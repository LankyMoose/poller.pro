import { usePageContext } from "$/context/pageContext"
import { Transition, useEffect, useRef, useState } from "kaioken"
import { Modal } from "./modal/Modal"
import { GoogleIcon } from "./icons/auth/GoogleIcon"
import { Avatar } from "./Avatar"
import { PublicUser } from "$/types"

export function UserAuth() {
  const { user } = usePageContext()

  return user ? <UserDisplay user={user} /> : <AuthModal />
}

function UserDisplay({ user }: { user: PublicUser }) {
  const { isClient } = usePageContext()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isClient) return
    if (!menuRef.current) return
    window.addEventListener("keyup", handleKeyPress)
    document.addEventListener("click", handleClickOutside)
    return () => {
      window.removeEventListener("keyup", handleKeyPress)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [menuRef.current])

  function handleKeyPress(e: KeyboardEvent) {
    if (!open) return
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (!open) return
    if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
  }

  return (
    <div ref={menuRef} className="flex flex-col gap-2 items-end relative">
      <button
        onclick={() => setOpen((prev) => !prev)}
        className="flex gap-2 items-center"
        title={user.name}
      >
        <Avatar url={user.avatarUrl} size={24} />
      </button>
      <Transition
        in={open}
        timings={[70, 150, 150, 150]}
        element={(state) => {
          if (state === "exited") return null
          const opacity = state === "entered" ? "1" : "0"
          return (
            <div
              className="absolute top-full flex flex-col w-auto transition-all rounded border text-center bg-neutral-100 dark:bg-neutral-800 shadow shadow-[#111a]"
              style={{ opacity }}
            >
              <a href="/logout" className="py-1 px-2 text-nowrap">
                <small>Log Out</small>
              </a>
            </div>
          )
        }}
      />
    </div>
  )
}

function AuthModal() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button onclick={() => setModalOpen(true)} className="text-xs underline">
        Log in
      </button>
      <Transition
        in={modalOpen}
        timings={[70, 150, 150, 150]}
        element={(state) => (
          <Modal state={state} close={() => setModalOpen(false)}>
            <h4 className="text-lg font-bold text-center">Log in</h4>
            <br />
            <div>
              <AuthModalProviderList />
            </div>
          </Modal>
        )}
      />
    </>
  )
}

function AuthModalProviderList() {
  const options = [
    {
      title: "Google",
      Icon: GoogleIcon,
    },
  ]

  return (
    <div className="flex gap flex-column items-center justify-center">
      {options.map((Option) => (
        <a
          href={`/login/${Option.title.toLowerCase()}`}
          className="flex gap-2 p-3 bg-white bg-opacity-15"
        >
          <Option.Icon />
          <small>Continue with {Option.title}</small>
        </a>
      ))}
    </div>
  )
}
