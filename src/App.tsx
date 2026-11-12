import { Suspense, lazy, useEffect, useState } from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import CharacterList from './components/characters/CharacterList'
import CharacterDetail from './components/characters/CharacterDetail'
import LeagueHistory from './components/leagues/LeagueHistory'
import DiaryList from './components/diary/DiaryList'
import DiaryPost from './components/diary/DiaryPost'
import { buildHash, parseHash } from './utils/router'
import type { RouteState } from './utils/router'
import type { TabId } from './types'

// recharts を含むため遅延読み込みにして main bundle を膨らませない
const StatsPage = lazy(() => import('./components/stats/StatsPage'))

// App の状態源は URL hash。UI 操作 → hash 更新 → hashchange で再描画、
// の一方向フローで、リロード・共有・ブラウザバックに対応する。
export default function App() {
  const [route, setRoute] = useState<RouteState>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (next: RouteState) => {
    const hash = buildHash(next)
    // 同一 hash への代入でも履歴エントリが積まれるため、変化時のみ反映する。
    // location.hash への直接代入は react-hooks/immutability に抵触するため
    // assign() を使う (同一文書の hash 変更なのでリロードは発生しない)
    if (window.location.hash !== hash) {
      window.location.assign(hash)
    }
  }

  const handleTabChange = (tab: TabId) => {
    // タブ切り替え時は詳細選択 (キャラ・日記) をリセットする
    navigate({ ...route, tab, character: undefined, diaryDate: undefined })
  }

  const handleLeagueChange = (league: string) => {
    navigate({ ...route, league })
  }

  const renderContent = () => {
    switch (route.tab) {
      case 'dashboard':
        return (
          <Dashboard selectedLeague={route.league} onTabChange={handleTabChange} />
        )

      case 'characters':
        if (route.character) {
          return (
            <CharacterDetail
              name={route.character}
              onBack={() => navigate({ ...route, character: undefined })}
            />
          )
        }
        return (
          <CharacterList
            selectedLeague={route.league}
            onSelect={(name) => navigate({ ...route, character: name })}
          />
        )

      case 'leagues':
        return <LeagueHistory selectedLeague={route.league} />

      case 'stats':
        return (
          <Suspense fallback={<p className="text-sm text-text-muted">Loading stats...</p>}>
            <StatsPage selectedLeague={route.league} />
          </Suspense>
        )

      case 'diary':
        if (route.diaryDate) {
          return (
            <DiaryPost
              date={route.diaryDate}
              onBack={() => navigate({ ...route, diaryDate: undefined })}
            />
          )
        }
        return (
          <DiaryList
            selectedLeague={route.league}
            onSelect={(date) => navigate({ ...route, diaryDate: date })}
          />
        )
    }
  }

  return (
    <Layout
      activeTab={route.tab}
      selectedLeague={route.league}
      onTabChange={handleTabChange}
      onLeagueChange={handleLeagueChange}
    >
      {renderContent()}
    </Layout>
  )
}
