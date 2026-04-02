import type { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import type { TabId } from '../../types'

interface LayoutProps {
  activeTab: TabId
  selectedLeague: string
  onTabChange: (tab: TabId) => void
  onLeagueChange: (league: string) => void
  children: ReactNode
}

export default function Layout({
  activeTab,
  selectedLeague,
  onTabChange,
  onLeagueChange,
  children,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex flex-1">
        <Sidebar selectedLeague={selectedLeague} onLeagueChange={onLeagueChange} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
