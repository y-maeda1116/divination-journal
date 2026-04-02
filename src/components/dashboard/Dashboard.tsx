import { loadCharacters, loadLeagues, loadDiaryEntries } from '../../utils/contentLoader'
import type { TabId } from '../../types'

interface DashboardProps {
  selectedLeague: string
  onTabChange: (tab: TabId) => void
}

export default function Dashboard({ selectedLeague, onTabChange }: DashboardProps) {
  const characters = loadCharacters().filter(
    (c) => selectedLeague === 'all' || c.league === selectedLeague,
  )
  const leagues = loadLeagues().filter(
    (l) => selectedLeague === 'all' || l.id === selectedLeague,
  )
  const recentDiary = loadDiaryEntries()
    .filter((e) => selectedLeague === 'all' || e.league === selectedLeague)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-text-bright">
          Active Characters
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <div
              key={char.name}
              className="rounded-lg border border-border bg-bg-card p-4 transition-colors hover:border-accent/50"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-text-bright">{char.name}</h3>
                <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">
                  Lv.{char.level}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {char.ascendancy || char.class} — {char.league}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-bg-primary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min((char.level / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {characters.length === 0 && (
          <p className="text-sm text-text-muted">No characters found for this league.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-text-bright">
          League Progress
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {leagues.map((league) => {
            const achieved = league.goals?.filter((g) => g.achieved).length ?? 0
            const total = league.goals?.length ?? 0
            return (
              <div
                key={league.id}
                className="rounded-lg border border-border bg-bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-bright">{league.id}</h3>
                  {total > 0 && (
                    <span className="text-sm text-text-muted">
                      {achieved}/{total} goals
                    </span>
                  )}
                </div>
                {total > 0 && (
                  <div className="mt-3 space-y-1">
                    {league.goals?.map((goal, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            goal.achieved ? 'bg-accent-green' : 'bg-border'
                          }`}
                        />
                        <span
                          className={
                            goal.achieved ? 'text-text-primary' : 'text-text-muted'
                          }
                        >
                          {goal.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-lg font-semibold text-text-bright">Recent Diary</h2>
          <button
            onClick={() => onTabChange('diary')}
            className="text-sm text-accent hover:text-accent-hover"
          >
            View all
          </button>
        </div>
        <div className="space-y-3">
          {recentDiary.map((entry) => (
            <div
              key={entry.date}
              className="rounded-lg border border-border bg-bg-card p-4"
            >
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>{entry.date}</span>
                <span className="text-accent">{entry.league}</span>
              </div>
              <h3 className="mt-1 font-semibold text-text-bright">{entry.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                {entry.content.slice(0, 150)}...
              </p>
            </div>
          ))}
          {recentDiary.length === 0 && (
            <p className="text-sm text-text-muted">No diary entries yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
