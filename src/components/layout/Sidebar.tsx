import { loadLeagues, loadCharacters } from '../../utils/contentLoader'
import { buildLeagueViews } from '../../utils/leagues'
import type { LeagueView } from '../../utils/leagues'

interface SidebarProps {
  selectedLeague: string
  onLeagueChange: (league: string) => void
}

export default function Sidebar({ selectedLeague, onLeagueChange }: SidebarProps) {
  const leagueViews = buildLeagueViews(loadLeagues(), loadCharacters())
  const permanent = leagueViews.filter((l) => l.isPermanent)
  const challenge = leagueViews.filter((l) => !l.isPermanent)

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
        <LeagueGroup
          label="Permanent"
          leagues={permanent}
          selectedLeague={selectedLeague}
          onLeagueChange={onLeagueChange}
        />
        <LeagueGroup
          label="Challenge & Events"
          leagues={challenge}
          selectedLeague={selectedLeague}
          onLeagueChange={onLeagueChange}
        />
      </ul>
    </aside>
  )
}

interface LeagueGroupProps {
  label: string
  leagues: LeagueView[]
  selectedLeague: string
  onLeagueChange: (league: string) => void
}

function LeagueGroup({ label, leagues, selectedLeague, onLeagueChange }: LeagueGroupProps) {
  if (leagues.length === 0) {
    return null
  }

  return (
    <>
      <li className="pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </li>
      {leagues.map((league) => (
        <li key={league.id}>
          <button
            onClick={() => onLeagueChange(league.id)}
            className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors ${
              selectedLeague === league.id
                ? 'bg-accent/20 text-accent'
                : 'text-text-primary hover:bg-bg-card-hover'
            }`}
          >
            <span className="truncate">{league.id}</span>
            <span className="ml-2 shrink-0 text-xs text-text-muted">
              {league.characterCount}
            </span>
          </button>
        </li>
      ))}
    </>
  )
}
