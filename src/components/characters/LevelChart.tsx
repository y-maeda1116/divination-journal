import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { loadHistory } from '../../utils/contentLoader'
import { buildLevelSeries } from '../../utils/history'
import type { LevelPoint } from '../../utils/history'

interface LevelChartProps {
  name: string
}

type LoadState = 'loading' | 'error' | 'ready'

// LevelChart は履歴スナップショットからキャラのレベル推移を折れ線で描く。
// recharts を抱えているため CharacterDetail から React.lazy で遅延読み込みされ、
// main bundle に入らない。
export default function LevelChart({ name }: LevelChartProps) {
  const [state, setState] = useState<{ status: LoadState; points: LevelPoint[] }>({
    status: 'loading',
    points: [],
  })

  useEffect(() => {
    let cancelled = false

    loadHistory()
      .then((snapshots) => {
        if (!cancelled) {
          setState({ status: 'ready', points: buildLevelSeries(snapshots, name) })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error', points: [] })
        }
      })

    return () => {
      cancelled = true
    }
  }, [name])

  if (state.status === 'loading') {
    return <p className="text-sm text-text-muted">Loading level history...</p>
  }
  if (state.status === 'error') {
    return <p className="text-sm text-text-muted">Level history is unavailable.</p>
  }
  if (state.points.length === 0) {
    return <p className="text-sm text-text-muted">No level history recorded yet.</p>
  }

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={state.points} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#2a2a35" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(date: string) => date.slice(5)}
            tick={{ fill: '#6b6b7b', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#2a2a35' }}
          />
          <YAxis
            domain={['dataMin - 2', 'dataMax + 2']}
            tick={{ fill: '#6b6b7b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a24',
              border: '1px solid #2a2a35',
              borderRadius: 8,
            }}
            labelStyle={{ color: '#b8b8c8' }}
          />
          <Line
            type="monotone"
            dataKey="level"
            stroke="#af6025"
            strokeWidth={2}
            // 点が 1-2 個の間は線が描けないためドットを出し、増えたら消す
            dot={state.points.length <= 2}
            activeDot={{ r: 4, fill: '#af6025', stroke: '#12121a', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
