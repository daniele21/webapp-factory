import { TopBar } from '../components/factory'
import BottomNav from '../components/BottomNav'
import { NAV } from '../../../../../packages/config/nav'
import { AuthMenuConnected } from '../components/AuthMenuConnected'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg grid grid-rows-[auto_1fr_auto]">
      {/* Use the factory TopBar and pass the NAV items from the shared config */}
      <TopBar 
        items={NAV as any} 
        title="Webapp Factory" 
        actions={<AuthMenuConnected />}
      />

      <main className="p-4">{children}</main>
      <BottomNav />
    </div>
  )
}
