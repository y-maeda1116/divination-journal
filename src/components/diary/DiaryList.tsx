import { loadDiaryEntries } from '../../utils/contentLoader'
import type { DiaryEntry } from '../../types'

interface DiaryListProps {
  selectedLeague: string
  onSelect: (date: string) => void
}

export default function DiaryList({ selectedLeague, onSelect }: DiaryListProps) {
  const entries = loadDiaryEntries().filter(
    (e) => selectedLeague === 'all' || e.league === selectedLeague,
  )

  const grouped = entries.reduce<Record<string, DiaryEntry[]>>((acc, entry) => {
    const month = entry.date.slice(0, 7)
    return {
      ...acc,
      [month]: [...(acc[month] ?? []), entry],
    }
  }, {})

  return (
    <div>
      <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-text-bright">
        Diary
      </h2>
      <div className="space-y-6">
        {Object.entries(grouped).map(([month, monthEntries]) => (
          <div key={month}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
              {month}
            </h3>
            <div className="space-y-3">
              {monthEntries.map((entry) => (
                <button
                  key={entry.date}
                  onClick={() => onSelect(entry.date)}
                  className="w-full rounded-lg border border-border bg-bg-card p-4 text-left transition-colors hover:border-accent/50 hover:bg-bg-card-hover"
                >
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>{entry.date}</span>
                    <span className="text-accent">{entry.league}</span>
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-bg-primary px-1.5 py-0.5 text-[10px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h4 className="mt-1 font-semibold text-text-bright">{entry.title}</h4>
                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                    {entry.content.slice(0, 150)}...
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {entries.length === 0 && (
        <p className="text-sm text-text-muted">No diary entries found.</p>
      )}
    </div>
  )
}
