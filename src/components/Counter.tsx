import { useState } from "kaioken"
import { Button } from "./atoms/Button"

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <>
      <span>Count: {count}</span>{" "}
      <Button variant="primary" onclick={() => setCount((prev) => prev + 1)}>
        Increment
      </Button>
    </>
  )
}
