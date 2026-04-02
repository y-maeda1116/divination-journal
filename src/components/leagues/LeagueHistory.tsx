import { loadLeagues, loadCharacters } from '../../utils/contentLoader'

interface LeagueHistoryProps {
  selectedLeague: string
}

export default function LeagueHistory({ selectedLeague }: LeagueHistoryProps) {
  const leagues = loadLeagues().filter(
    (l) => selectedLeague === 'all' || l.id === selectedLeague,
  )
  const characters = loadCharacters()

  return (
    <div>
      <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-text-bright">
        League History
      </h2>
      <div className="space-y-6">
        {leagues.map((league) => {
          const leagueChars = characters.filter((c) =>
            league.characters.includes(c.name),
          )
          const achieved = league.goals?.filter((g) => g.achieved).length ?? 0
          const total = league.goals?.length ?? 0

          return (
            <div
              key={league.id}
              className="rounded-lg border border-border bg-bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-text-bright">{league.id}</h3>
                  {league.description && (
                    <p className="mt-1 text-sm text-text-muted">{league.description}</p>
                  )}
                  {league.startAt && (
                    <p className="mt-1 text-xs text-text-muted">
                      Started: {new Date(league.startAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {total > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent">
                      {achieved}/{total}
                    </div>
                    <div className="text-xs text-text-muted">Goals</div>
                  </div>
                )}
              </div>

              {total > 0 && (
                <div className="mt-4">
                  <div className="mb-2 h-2 rounded-full bg-bg-primary">
                    <div
                      className="h-full rounded-full bg-accent-green transition-all"
                      style={{
                        width: `${total > 0 ? (achieved / total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="grid gap-1 md:grid-cols-2">
                    {league.goals?.map((goal, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded text-xs ${
                            goal.achieved
                              ? 'bg-accent-green text-white'
                              : 'border border-border text-text-muted'
                          }`}
                        >
                          {goal.achieved ? '\u2713' : ''}
                        </span>
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
                </div>
              )}

              {leagueChars.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <h4 className="mb-2 text-sm font-semibold text-text-muted">
                    Characters
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {leagueChars.map((char) => (
                      <span
                        key={char.name}
                        className="rounded bg-bg-primary px-3 py-1 text-sm text-text-primary"
                      >
                        {char.name}{' '}
                        <span className="text-accent">Lv.{char.level}</span>{' '}
                        <span className="text-text-muted">
                          ({char.ascendancy || char.class})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {leagues.length === 0 && (
        <p className="text-sm text-text-muted">No leagues found.</p>
      )}
    </div>
  )
}
