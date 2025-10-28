import NavSidebar from '../components/NavSidebar'
import { Footer } from '../components/factory'
import { ThemeSwitch } from '../components/ThemeSwitch'
import { AuthMenuConnected } from '../components/AuthMenuConnected'

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg grid grid-cols-[260px_1fr] grid-rows-[auto_1fr_auto]">
      <aside className="row-span-3 border-r"><NavSidebar /></aside>
      <header className="col-start-2 border-b border-border p-3 flex items-center justify-between">
        <h1 className="font-semibold">Webapp Factory</h1>
        <div className="flex items-center gap-3">
          <ThemeSwitch />
          <AuthMenuConnected />
        </div>
      </header>
      <main className="p-6">{children}</main>
      <footer className="col-start-2"><Footer /></footer>
    </div>
  )
}
