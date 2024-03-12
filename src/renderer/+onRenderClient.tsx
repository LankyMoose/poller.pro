// https://vike.dev/onRenderClient
import type { OnRenderClientAsync } from "vike/types"
import { hydrate } from "kaioken/ssr"
import { getTitle } from "./utils"
import { App } from "./App"
import { type LiveSocket, createLiveSocket } from "$/liveSocket"

declare global {
  interface Window {
    liveSocket: LiveSocket
  }
}

export const onRenderClient: OnRenderClientAsync = async (pageContext) => {
  const container = document.getElementById("page-root")!

  if (pageContext.isHydration) {
    if (pageContext.user) {
      window.liveSocket = createLiveSocket()
    }
    document.title = getTitle(pageContext)
    hydrate(App, container, { pageContext })
  }
}
