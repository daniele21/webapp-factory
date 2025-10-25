import NavSidebar from '../components/NavSidebar'
import Footer from '../components/Footer'

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] grid-rows-[auto_1fr_auto]">
      <aside className="row-span-3 border-r"><NavSidebar /></aside>
      <header className="p-4 border-b">Webapp Factory</header>
      <main className="p-6">{children}</main>
      <footer className="col-start-2"><Footer /></footer>
    </div>
  )
}
