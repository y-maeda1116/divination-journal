import type { League } from '../types/league'
import type { Character } from '../types/character'

// PoE の常設リーグ(パーマネント)の league ID。キャラデータから動的導出した
// リーグには startAt 情報が無いため、既知 ID で判定する。leagues JSON 由来の
// リーグは startAt === null も常設の根拠にする(イベント系は開始日が入る)。
const PERMANENT_LEAGUE_IDS = new Set(['Standard', 'Hardcore'])

// 表示に使うリーグのビューモデル。leagues JSON に無いリーグもキャラの
// league フィールドから導出して含める。
export interface LeagueView {
  id: string
  isPermanent: boolean
  characterCount: number
  /** content/leagues/*.json 由来の詳細(goals・description 等)。キャラのみに存在するリーグは undefined */
  detail?: League
}

export function isPermanentLeague(id: string, detail?: League): boolean {
  // API から取得した詳細がある場合は startAt が最も確実な根拠
  if (detail) {
    return detail.startAt === null
  }
  return PERMANENT_LEAGUE_IDS.has(id)
}

// leagues JSON のリーグと、キャラの league フィールドにのみ出現するリーグを
// マージして LeagueView 化する。キャラ数は実キャラデータで数える(JSON の
// characters 配列は fetch 失敗時に古くなるため信用しない)。
// ソート: グループ内でキャラ数降順、同数は id 昇順。
export function buildLeagueViews(leagues: League[], characters: Character[]): LeagueView[] {
  const details = new Map(leagues.map((l) => [l.id, l]))

  const counts = new Map<string, number>()
  for (const character of characters) {
    counts.set(character.league, (counts.get(character.league) ?? 0) + 1)
  }

  const ids = new Set([...details.keys(), ...counts.keys()])

  return [...ids]
    .map((id): LeagueView => {
      const detail = details.get(id)
      return {
        id,
        isPermanent: isPermanentLeague(id, detail),
        characterCount: counts.get(id) ?? 0,
        detail,
      }
    })
    .sort(
      (a, b) =>
        Number(b.isPermanent) - Number(a.isPermanent) ||
        b.characterCount - a.characterCount ||
        a.id.localeCompare(b.id),
    )
}
