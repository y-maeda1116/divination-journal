import { useState } from 'react'
import { loadCharacters } from '../../utils/contentLoader'
import { groupCharactersByClass } from '../../utils/characterClasses'
import type { Character } from '../../types/character'

type ViewMode = 'grid' | 'class'

interface CharacterListProps {
  selectedLeague: string
  onSelect: (name: string) => void
}

export default function CharacterList({ selectedLeague, onSelect }: CharacterListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const characters = loadCharacters().filter(
    (c) => selectedLeague === 'all' || c.league === selectedLeague,
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-lg font-semibold text-text-bright">Characters</h2>
        <div className="flex gap-1">
          <ViewModeButton
            label="Grid"
            active={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          />
          <ViewModeButton
            label="By Class"
            active={viewMode === 'class'}
            onClick={() => setViewMode('class')}
          />
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <CharacterCard key={char.name} character={char} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <ClassGroupedView characters={characters} onSelect={onSelect} />
      )}

      {characters.length === 0 && (
        <p className="text-sm text-text-muted">No characters found.</p>
      )}
    </div>
  )
}

interface ViewModeButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

function ViewModeButton({ label, active, onClick }: ViewModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1 text-xs transition-colors ${
        active
          ? 'bg-accent/20 text-accent'
          : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  )
}

interface ClassGroupedViewProps {
  characters: Character[]
  onSelect: (name: string) => void
}

// 基礎クラス → アセンダンシーの2階層でグループ化し、各グループ内は
// レベル降順に並べて表示する。
function ClassGroupedView({ characters, onSelect }: ClassGroupedViewProps) {
  const groups = groupCharactersByClass(characters)

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.baseClass}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            {group.baseClass} ({group.total})
          </h3>
          <div className="space-y-5">
            {group.ascendancies.map((ascendancy) => (
              <div key={ascendancy.ascendancy}>
                <h4 className="mb-2 text-sm font-semibold text-text-primary">
                  {ascendancy.ascendancy}{' '}
                  <span className="text-xs font-normal text-text-muted">
                    ({ascendancy.characters.length})
                  </span>
                </h4>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {ascendancy.characters.map((char) => (
                    <CharacterCard key={char.name} character={char} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

interface CharacterCardProps {
  character: Character
  onSelect: (name: string) => void
}

function CharacterCard({ character, onSelect }: CharacterCardProps) {
  return (
    <button
      onClick={() => onSelect(character.name)}
      className="rounded-lg border border-border bg-bg-card p-4 text-left transition-colors hover:border-accent/50 hover:bg-bg-card-hover"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-bright">{character.name}</h3>
        <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">
          Lv.{character.level}
        </span>
      </div>
      <p className="mt-1 text-sm text-text-muted">
        {character.ascendancy || character.class}
      </p>
      <p className="text-xs text-text-muted">{character.league}</p>
    </button>
  )
}
