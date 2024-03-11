import { useRef, useEffect, Transition } from "kaioken"
import { ModalBackdrop } from "./ModalBackdrop"
import "./Modal.css"

type ModalProps = {
  open: boolean
  close: () => void
}

export const Modal: Kaioken.FC<ModalProps> = ({ open, close, children }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.addEventListener("keyup", handleKeyPress)
    return () => window.removeEventListener("keyup", handleKeyPress)
  }, [])

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault()
      if (open) close()
    }
  }

  return (
    <Transition
      in={open}
      timings={[70, 150, 150, 150]}
      element={(state) => {
        if (state == "exited") return null
        const opacity = state === "entered" ? "1" : "0"
        const scale = state === "entered" ? 1 : 0.85
        const translateY = state === "entered" ? -50 : -100

        return (
          <ModalBackdrop
            ref={wrapperRef}
            onclick={(e) => e.target === wrapperRef.current && close()}
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
