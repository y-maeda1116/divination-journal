import { loadCharacters } from '../../utils/contentLoader'

interface CharacterListProps {
  selectedLeague: string
  onSelect: (name: string) => void
}

export default function CharacterList({ selectedLeague, onSelect }: CharacterListProps) {
  const characters = loadCharacters().filter(
    (c) => selectedLeague === 'all' || c.league === selectedLeague,
  )

  return (
    <div>
      <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-text-bright">
        Characters
      </h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {characters.map((char) => (
          <button
            key={char.name}
            onClick={() => onSelect(char.name)}
            className="rounded-lg border border-border bg-bg-card p-4 text-left transition-colors hover:border-accent/50 hover:bg-bg-card-hover"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-bright">{char.name}</h3>
              <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">
                Lv.{char.level}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {char.ascendancy || char.class}
            </p>
            <p className="text-xs text-text-muted">{char.league}</p>
            <div className="mt-3 h-1.5 rounded-full bg-bg-primary">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.min((char.level / 100) * 100, 100)}%` }}
              />
            </div>
          </button>
        ))}
      </div>
      {characters.length === 0 && (
        <p className="text-sm text-text-muted">No characters found.</p>
      )}
    </div>
  )
}
