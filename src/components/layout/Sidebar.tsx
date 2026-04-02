import { loadLeagues } from '../../utils/contentLoader'

interface SidebarProps {
  selectedLeague: string
  onLeagueChange: (league: string) => void
}

export default function Sidebar({ selectedLeague, onLeagueChange }: SidebarProps) {
  const leagues = loadLeagues()

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-bg-card p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Leagues
      </h2>
      <ul className="space-y-1">
        <li>
          <button
            onClick={() => onLeagueChange('all')}
            className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
              selectedLeague === 'all'
                ? 'bg-accent/20 text-accent'
                : 'text-text-primary hover:bg-bg-card-hover'
            }`}
          >
            All Leagues
          </button>
        </li>
        {leagues.map((league) => (
          <li key={league.id}>
            <button
              onClick={() => onLeagueChange(league.id)}
              className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                selectedLeague === league.id
                  ? 'bg-accent/20 text-accent'
                  : 'text-text-primary hover:bg-bg-card-hover'
              }`}
            >
              {league.id}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
