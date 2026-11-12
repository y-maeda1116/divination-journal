import type { TabId } from '../types'

// URL hash (#/characters/NAME?league=Standard) とルート状態の相互変換。
// App は hash を唯一の状態源とし、hashchange で再描画する。

const TABS: readonly TabId[] = ['dashboard', 'characters', 'leagues', 'stats', 'diary']

export interface RouteState {
  tab: TabId
  // 'all' は「全リーグ」を表すセンチネル値
  league: string
  // characters タブで選択中のキャラ名
  character?: string
  // diary タブで選択中の記事日付 (YYYY-MM-DD)
  diaryDate?: string
}

function isTabId(value: string): value is TabId {
  return (TABS as readonly string[]).includes(value)
}

// '.' / '..' のような相対パスセグメントはキャラ名・日付として無効
function isPathSegmentValid(value: string): boolean {
  return value !== '' && value !== '.' && value !== '..'
}

export function parseHash(hash: string): RouteState {
  // 先頭の '#' を取り、クエリ部とパス部を分離する
  const [path, queryString] = hash.replace(/^#/, '').split('?')
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))

  const [rawTab, id] = segments
  const tab = isTabId(rawTab) ? rawTab : 'dashboard'

  const league = new URLSearchParams(queryString).get('league') ?? 'all'

  if (tab === 'characters' && id !== undefined && isPathSegmentValid(id)) {
    return { tab, league, character: id }
  }
  if (tab === 'diary' && id !== undefined && isPathSegmentValid(id)) {
    return { tab, league, diaryDate: id }
  }
  return { tab, league }
}

export function buildHash(state: RouteState): string {
  const segments: string[] = [state.tab]
  if (state.tab === 'characters' && state.character) {
    segments.push(encodeURIComponent(state.character))
  } else if (state.tab === 'diary' && state.diaryDate) {
    segments.push(encodeURIComponent(state.diaryDate))
  }

  const path = `/${segments.join('/')}`
  const query = state.league !== 'all' ? `?league=${encodeURIComponent(state.league)}` : ''
  return `#${path}${query}`
}
