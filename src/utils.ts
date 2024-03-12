export const UTC = {
  now: () => Math.floor(Date.now() / 1000),
}

export function trapFocus(element: Element, e: KeyboardEvent) {
  if (e.key === "Tab") {
    const focusableModalElements = element.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    console.log(focusableModalElements)
    const firstElement = focusableModalElements[0]
    const lastElement =
      focusableModalElements[focusableModalElements.length - 1]
    if (
      document.activeElement &&
      !element.contains(document.activeElement) &&
      firstElement &&
      firstElement instanceof HTMLElement
    ) {
      e.preventDefault()
      return firstElement.focus()
    }
    if (e.shiftKey) {
      if (
        document.activeElement === firstElement &&
        lastElement instanceof HTMLElement
      ) {
        lastElement.focus()
        e.preventDefault()
      }
    } else {
      if (
        document.activeElement === lastElement &&
        firstElement instanceof HTMLElement
      ) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }
}
