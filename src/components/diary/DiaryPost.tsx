import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { loadDiaryByDate } from '../../utils/contentLoader'

interface DiaryPostProps {
  date: string
  onBack: () => void
}

export default function DiaryPost({ date, onBack }: DiaryPostProps) {
  const entry = loadDiaryByDate(date)

  if (!entry) {
    return (
      <div>
        <p className="text-text-muted">Entry not found.</p>
        <button onClick={onBack} className="mt-2 text-sm text-accent hover:text-accent-hover">
          Back to diary
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
        &larr; Back to diary
      </button>

      <article className="rounded-lg border border-border bg-bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
          <span>{entry.date}</span>
          <span className="text-accent">{entry.league}</span>
          <span className="text-text-muted">{entry.character}</span>
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-bg-primary px-1.5 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mb-6 text-2xl font-bold text-text-bright">{entry.title}</h1>

        <div className="prose prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{entry.content}</Markdown>
        </div>
      </article>
    </div>
  )
}
