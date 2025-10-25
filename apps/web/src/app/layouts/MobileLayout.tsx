import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg grid grid-rows-[auto_1fr_auto]">
      <TopBar />
      <main className="p-4">{children}</main>
      <BottomNav />
    </div>
  )
}
