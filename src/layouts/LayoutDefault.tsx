import { Navbar } from "$/components/Navbar"

export function LayoutDefault({ children }: { children?: JSX.Element[] }) {
  return (
    <div className="flex flex-col items-center m-auto w-full min-h-screen">
      <Navbar />
      <Content>{children}</Content>
    </div>
  )
}

function Content({ children }: { children?: JSX.Element[] }) {
  return <div className="px-5 w-full flex flex-col flex-grow">{children}</div>
}
