import { loadCharacterByName } from '../../utils/contentLoader'

interface CharacterDetailProps {
  name: string
  onBack: () => void
}

const RARITY_COLORS: Record<string, string> = {
  Unique: 'text-rarity-unique',
  Rare: 'text-rarity-rare',
  Magic: 'text-rarity-magic',
  Normal: 'text-rarity-normal',
  Currency: 'text-rarity-currency',
}

export default function CharacterDetail({ name, onBack }: CharacterDetailProps) {
  const character = loadCharacterByName(name)

  if (!character) {
    return (
      <div>
        <p className="text-text-muted">Character &quot;{name}&quot; not found.</p>
        <button onClick={onBack} className="mt-2 text-sm text-accent hover:text-accent-hover">
          Back to list
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-accent hover:text-accent-hover"
      >
        &larr; Back to characters
      </button>

      <div className="rounded-lg border border-border bg-bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-bright">{character.name}</h2>
            <p className="text-text-muted">
              {character.ascendancy || character.class} — {character.league}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-accent">Lv.{character.level}</div>
            <div className="text-xs text-text-muted">
              {(character.experience / 1_000_000).toFixed(1)}M XP
            </div>
          </div>
        </div>

        <div className="mt-4 h-2 rounded-full bg-bg-primary">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.min((character.level / 100) * 100, 100)}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-text-muted">
          Last updated: {new Date(character.fetchedAt).toLocaleString()}
        </p>
      </div>

      {character.passives && (
        <div className="mt-6 rounded-lg border border-border bg-bg-card p-6">
          <h3 className="mb-3 text-lg font-semibold text-text-bright">Passive Tree</h3>
          <div className="flex gap-4 text-sm text-text-muted">
            <span>Skill Points: {character.passives.skillPoints}</span>
          </div>
        </div>
      )}

      {character.items && (
        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold text-text-bright">Equipment</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(character.items)
              .filter(([, item]) => item != null)
              .map(([slot, item]) => {
                const typedItem = item as { name: string; typeLine: string; rarity: string; explicitMods?: string[] }
                return (
                  <div
                    key={slot}
                    className="rounded border border-border bg-bg-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase text-text-muted">{slot}</span>
                      <span
                        className={`text-xs ${RARITY_COLORS[typedItem.rarity] ?? 'text-text-muted'}`}
                      >
                        {typedItem.rarity}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-text-bright">
                      {typedItem.name || typedItem.typeLine}
                    </p>
                    {typedItem.name && (
                      <p className="text-xs text-text-muted">{typedItem.typeLine}</p>
                    )}
                    {typedItem.explicitMods && typedItem.explicitMods.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-accent-green">
                        {typedItem.explicitMods.map((mod, i) => (
                          <li key={i}>{mod}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
