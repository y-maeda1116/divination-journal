import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { loadCharacters, loadLeagues } from '../../utils/contentLoader'
import { classDistribution, leagueSummary, levelHistogram } from '../../utils/stats'
import type { LeagueView } from '../../utils/leagues'

interface StatsPageProps {
  selectedLeague: string
}

const CHART_TOOLTIP_STYLE = {
  background: '#1a1a24',
  border: '1px solid #2a2a35',
  borderRadius: 8,
}

// StatsPage はクラス分布・レベル帯・リーグ別の集計をチャートで示す。
// recharts を抱えているため App から React.lazy で遅延読み込みされる。
export default function StatsPage({ selectedLeague }: StatsPageProps) {
  const characters = loadCharacters().filter(
    (c) => selectedLeague === 'all' || c.league === selectedLeague,
  )
  const classes = classDistribution(characters)
  const histogram = levelHistogram(characters)
  const leagueViews = leagueSummary(characters, loadLeagues())

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-bright">Class Distribution</h2>
        {classes.length > 0 ? (
          <div style={{ height: Math.max(140, classes.length * 36 + 24) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classes}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
              >
                <CartesianGrid stroke="#2a2a35" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: '#6b6b7b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a35' }}
                />
                <YAxis
                  type="category"
                  dataKey="baseClass"
                  width={88}
                  tick={{ fill: '#6b6b7b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(175, 96, 37, 0.08)' }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={{ color: '#b8b8c8' }}
                />
                <Bar
                  dataKey="count"
                  fill="#af6025"
                  barSize={20}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No characters found for this league.</p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-bright">Level Range</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#2a2a35" vertical={false} />
              <XAxis
                dataKey="range"
                tick={{ fill: '#6b6b7b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a35' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#6b6b7b', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                cursor={{ fill: 'rgba(175, 96, 37, 0.08)' }}
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={{ color: '#b8b8c8' }}
              />
              <Bar
                dataKey="count"
                fill="#af6025"
                barSize={24}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <LeagueTable views={leagueViews.filter((v) => v.isPermanent)} title="Permanent Leagues" />
      <LeagueTable views={leagueViews.filter((v) => !v.isPermanent)} title="Event Leagues" />
    </div>
  )
}

interface LeagueTableProps {
  views: LeagueView[]
  title: string
}

function LeagueTable({ views, title }: LeagueTableProps) {
  if (views.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-border bg-bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-text-bright">{title}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
            <th className="pb-2">League</th>
            <th className="pb-2 text-right">Characters</th>
          </tr>
        </thead>
        <tbody>
          {views.map((view) => (
            <tr key={view.id} className="border-b border-border/50 last:border-0">
              <td className="py-2 text-text-primary">{view.id}</td>
              <td className="py-2 text-right text-text-muted">{view.characterCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
