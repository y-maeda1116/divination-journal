import { useEffect, useState } from 'react'
import { loadHistory } from '../../utils/contentLoader'
import { buildDailyActivity } from '../../utils/activity'
import type { DailyActivity } from '../../utils/activity'
import type { HistorySnapshot } from '../../types/history'

type LoadState = 'loading' | 'error' | 'ready'

// gain (その日の合計レベル上昇量) を 0〜4 の強度に割り振る
function intensityOf(gain: number): number {
  if (gain === 0) return 0
  if (gain === 1) return 1
  if (gain < 5) return 2
  if (gain < 10) return 3
  return 4
}

const INTENSITY_BG = [
  'bg-bg-card-hover',
  'bg-accent-green/30',
  'bg-accent-green/50',
  'bg-accent-green/75',
  'bg-accent-green',
] as const

// date ('YYYY-MM-DD') を UTC 暦日として扱う (履歴の date は JST 暦日)
function toDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

interface WeekColumn {
  // その週に描く日 (日曜始まり)。期間前の余白は null
  days: (DailyActivity | null)[]
  // 週先頭 (日曜) の月ラベル。前週と同じ月なら null
  monthLabel: string | null
}

// 活動データを日曜始まりの週列に整形する。スナップショットに無い日は
// gain 0 (=null ではなく空セル扱い) ではなく期間外として描かない方針だと
// 取得漏れ日が空白に見えるため、期間内は全日埋める。
function buildWeeks(activity: DailyActivity[]): WeekColumn[] {
  if (activity.length === 0) {
    return []
  }

  const byDate = new Map(activity.map((a) => [a.date, a]))
  const first = toDate(activity[0].date)
  const last = toDate(activity[activity.length - 1].date)

  const weeks: WeekColumn[] = []
  let current: (DailyActivity | null)[] = Array.from({ length: first.getUTCDay() }, () => null)
  let lastMonth = -1
  let monthLabel: string | null = null

  for (let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = formatDate(d)
    current.push(byDate.get(date) ?? { date, gain: 0, playedCharacters: 0 })

    if (current.length === 7) {
      weeks.push({ days: current, monthLabel })
      current = []
      monthLabel = null
    }

    // 週の途中だが次の週の先頭月が変わるタイミングでラベルを仕込む
    if (current.length === 0 && d < last) {
      const next = new Date(d)
      next.setUTCDate(next.getUTCDate() + 1)
      const month = next.getUTCMonth()
      if (month !== lastMonth) {
        lastMonth = month
        monthLabel = next.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
      }
    }
  }

  if (current.length > 0) {
    weeks.push({ days: current, monthLabel })
  }

  return weeks
}

// ActivityHeatmap は日次レベル履歴から GitHub contributions 風のヒートマップを
// 描く。プレイ量の代理指標として「その日に上がったレベルの合計」を使う。
export default function ActivityHeatmap() {
  const [state, setState] = useState<{ status: LoadState; activity: DailyActivity[] }>({
    status: 'loading',
    activity: [],
  })

  useEffect(() => {
    let cancelled = false

    loadHistory()
      .then((snapshots: HistorySnapshot[]) => {
        if (!cancelled) {
          setState({ status: 'ready', activity: buildDailyActivity(snapshots) })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error', activity: [] })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return <p className="text-sm text-text-muted">Loading activity...</p>
  }
  if (state.status === 'error') {
    return <p className="text-sm text-text-muted">Failed to load play history.</p>
  }
  if (state.activity.length === 0) {
    return <p className="text-sm text-text-muted">No play history yet.</p>
  }

  const activeDays = state.activity.filter((a) => a.gain > 0).length
  const totalGain = state.activity.reduce((sum, a) => sum + a.gain, 0)
  const weeks = buildWeeks(state.activity)

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm text-text-muted">
          {activeDays} active days · {totalGain} levels gained
        </span>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <span>Less</span>
          {INTENSITY_BG.map((bg) => (
            <span key={bg} className={`h-2.5 w-2.5 rounded-sm ${bg}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {weeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="h-4 text-[10px] leading-4 text-text-muted">
                {week.monthLabel}
              </span>
              {week.days.map((day, j) =>
                day ? (
                  <span
                    key={day.date}
                    title={
                      day.gain > 0
                        ? `${day.date}: +${day.gain} levels`
                        : `${day.date}: no progress`
                    }
                    className={`h-3 w-3 rounded-sm ${INTENSITY_BG[intensityOf(day.gain)]}`}
                  />
                ) : (
                  <span key={`pad-${i}-${j}`} className="h-3 w-3" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
