import type { Config, PageContextServer } from "vike/types"

export default {
  passToClient: ["routeParams", "Layout", "user"] satisfies Array<
    keyof PageContextServer
  >,
  /* 
   no problems with enabling 'clientRouting' as we're currently 
   using destructive hydration. Currently disabled as chrome 
   has a small delay when programattically setting doc title 😭
  */
  clientRouting: true,
  meta: {
    title: {
      env: { server: false, client: true },
    },
  },
} satisfies Config
