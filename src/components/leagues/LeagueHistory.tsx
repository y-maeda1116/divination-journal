import { loadLeagues, loadCharacters } from '../../utils/contentLoader'
import { buildLeagueViews } from '../../utils/leagues'
import type { LeagueView } from '../../utils/leagues'
import type { Character } from '../../types/character'

interface LeagueHistoryProps {
  selectedLeague: string
}

export default function LeagueHistory({ selectedLeague }: LeagueHistoryProps) {
  const leagueViews = buildLeagueViews(loadLeagues(), loadCharacters())
    .filter((l) => selectedLeague === 'all' || l.id === selectedLeague)
  const characters = loadCharacters()
  const permanent = leagueViews.filter((l) => l.isPermanent)
  const challenge = leagueViews.filter((l) => !l.isPermanent)

  return (
    <div>
      <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-text-bright">
        League History
      </h2>
      <div className="space-y-6">
        <LeagueSection label="Permanent Leagues" leagues={permanent} characters={characters} />
        <LeagueSection
          label="Challenge & Event Leagues"
          leagues={challenge}
          characters={characters}
        />
      </div>
      {leagueViews.length === 0 && (
        <p className="text-sm text-text-muted">No leagues found.</p>
      )}
    </div>
  )
}

interface LeagueSectionProps {
  label: string
  leagues: LeagueView[]
  characters: Character[]
}

function LeagueSection({ label, leagues, characters }: LeagueSectionProps) {
  if (leagues.length === 0) {
    return null
  }

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </h3>
      <div className="space-y-6">
        {leagues.map((league) => (
          <LeagueCard key={league.id} league={league} characters={characters} />
        ))}
      </div>
    </section>
  )
}

interface LeagueCardProps {
  league: LeagueView
  characters: Character[]
}

function LeagueCard({ league, characters }: LeagueCardProps) {
  // リーグのキャラは実キャラデータでフィルタする(JSON の characters
  // 配列はリーグ取得が失敗している間に古くなるため)。
  const leagueChars = characters.filter((c) => c.league === league.id)
  const achieved = league.detail?.goals?.filter((g) => g.achieved).length ?? 0
  const total = league.detail?.goals?.length ?? 0

  return (
    <div className="rounded-lg border border-border bg-bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-xl font-bold text-text-bright">{league.id}</h4>
          {league.detail?.description && (
            <p className="mt-1 text-sm text-text-muted">{league.detail.description}</p>
          )}
          {league.detail?.startAt && (
            <p className="mt-1 text-xs text-text-muted">
              Started: {new Date(league.detail.startAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-accent">{leagueChars.length}</div>
          <div className="text-xs text-text-muted">Characters</div>
        </div>
      </div>

      {total > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-text-muted">Goals</span>
            <span className="font-semibold text-accent">
              {achieved}/{total}
            </span>
          </div>
          <div className="mb-2 h-2 rounded-full bg-bg-primary">
            <div
              className="h-full rounded-full bg-accent-green transition-all"
              style={{ width: `${total > 0 ? (achieved / total) * 100 : 0}%` }}
            />
          </div>
          <div className="grid gap-1 md:grid-cols-2">
            {league.detail?.goals?.map((goal, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded text-xs ${
                    goal.achieved
                      ? 'bg-accent-green text-white'
                      : 'border border-border text-text-muted'
                  }`}
                >
                  {goal.achieved ? '✓' : ''}
                </span>
                <span
                  className={goal.achieved ? 'text-text-primary' : 'text-text-muted'}
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
          <h4 className="mb-2 text-sm font-semibold text-text-muted">Characters</h4>
          <div className="flex flex-wrap gap-2">
            {leagueChars.map((char) => (
              <span
                key={char.name}
                className="rounded bg-bg-primary px-3 py-1 text-sm text-text-primary"
              >
                {char.name}{' '}
                <span className="text-accent">Lv.{char.level}</span>{' '}
                <span className="text-text-muted">({char.ascendancy || char.class})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
