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
  return <div className="p-5 pb-10 w-full flex-grow">{children}</div>
}
