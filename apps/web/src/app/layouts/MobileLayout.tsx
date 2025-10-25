import { useState } from 'react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import NavSidebar from '../components/NavSidebar'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg text-fg grid grid-rows-[auto_1fr_auto]">
      <TopBar onOpenNav={() => setNavOpen(true)} />

      {/* Slide-over mobile nav */}
      {navOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* backdrop */}
          <button
            aria-hidden
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          <div className={`relative z-60 h-full`}>
            <div className={`h-full transform ${navOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200`}>
              <NavSidebar mobile onClose={() => setNavOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <main className="p-4">{children}</main>
      <BottomNav />
    </div>
  )
}
