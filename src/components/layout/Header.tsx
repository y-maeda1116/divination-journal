import type { TabId } from '../../types'

const TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'characters', label: 'Characters' },
  { id: 'leagues', label: 'Leagues' },
  { id: 'diary', label: 'Diary' },
]

interface HeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b border-border bg-bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold tracking-wide text-text-bright">
          <span className="text-accent">PoE</span> Diary
        </h1>
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
