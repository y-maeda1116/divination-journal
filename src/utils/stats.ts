import type { Character } from '../types/character'
import type { League } from '../types/league'
import { baseClassOf } from './characterClasses'
import { buildLeagueViews, type LeagueView } from './leagues'

export interface ClassSlice {
  baseClass: string
  count: number
}

// classDistribution はキャラを基礎クラスごとに集計する。対応表に無いクラスは
// baseClassOf のフォールバック(Other)に従う。件数降順、同数は名前昇順。
export function classDistribution(characters: Character[]): ClassSlice[] {
  const counts = new Map<string, number>()
  for (const character of characters) {
    const base = baseClassOf(character)
    counts.set(base, (counts.get(base) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([baseClass, count]) => ({ baseClass, count }))
    .sort((a, b) => b.count - a.count || a.baseClass.localeCompare(b.baseClass))
}

export interface LevelBin {
  range: string
  count: number
}

// LEVEL_BIN_RANGES はヒストグラムの bin ラベル(固定順)。空 bin も並べて描画する
// ため、集計前に全 bin を用意する。
const LEVEL_BIN_RANGES = [
  '1-9',
  '10-19',
  '20-29',
  '30-39',
  '40-49',
  '50-59',
  '60-69',
  '70-79',
  '80-89',
  '90-99',
  '100',
] as const

function levelBinIndex(level: number): number {
  if (level >= 100) {
    return LEVEL_BIN_RANGES.length - 1
  }
  // 1-9 → 0, 10-19 → 1, ... 90-99 → 9(0 以下の不正値も先頭 bin に寄せる)
  return Math.max(0, Math.floor(level / 10))
}

// levelHistogram はレベルを 10 刻みの bin に集計する。空 bin も count 0 で返す。
export function levelHistogram(characters: Character[]): LevelBin[] {
  const bins: LevelBin[] = LEVEL_BIN_RANGES.map((range) => ({ range, count: 0 }))
  for (const character of characters) {
    bins[levelBinIndex(character.level)].count += 1
  }
  return bins
}

// leagueSummary はリーグ別の集計ビューを返す(buildLeagueViews を再利用)。
export function leagueSummary(characters: Character[], leagues: League[]): LeagueView[] {
  return buildLeagueViews(leagues, characters)
}
