import { useRef, useEffect, Transition } from "kaioken"
import { ModalBackdrop } from "./ModalBackdrop"
import "./Modal.css"
import { trapFocus } from "$/utils"

type ModalProps = {
  open: boolean
  close: () => void
}

export const Modal: Kaioken.FC<ModalProps> = ({ open, close, children }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const clickStartRef = useRef<EventTarget>(null)

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [wrapperRef.current])

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault()
      if (open) close()
      return
    }
    if (!wrapperRef.current) return
    trapFocus(wrapperRef.current!, e)
  }

  return (
    <Transition
      in={open}
      timings={[70, 150, 150, 150]}
      element={(state) => {
        if (state == "exited") {
          clickStartRef.current = null
          return null
        }
        const opacity = state === "entered" ? "1" : "0"
        const scale = state === "entered" ? 1 : 0.85
        const translateY = state === "entered" ? -50 : -100

        return (
          <ModalBackdrop
            ref={wrapperRef}
            onpointerdown={(e) => {
              clickStartRef.current = e.target
            }}
            onpointerup={(e) => {
              if (
                wrapperRef.current &&
                e.target === wrapperRef.current &&
                clickStartRef.current === e.target
              ) {
                close()
              }
              clickStartRef.current = null
            }}
            style={{ opacity }}
          >
            <div
              className="modal-content p-4"
              style={{
                transform: `translate(-50%, ${translateY}%) scale(${scale})`,
              }}
            >
              {children}
            </div>
          </ModalBackdrop>
        )
      }}
    />
  )
}
