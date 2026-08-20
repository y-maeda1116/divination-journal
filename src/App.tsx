import { Suspense, lazy, useState } from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import CharacterList from './components/characters/CharacterList'
import CharacterDetail from './components/characters/CharacterDetail'
import LeagueHistory from './components/leagues/LeagueHistory'
import DiaryList from './components/diary/DiaryList'
import DiaryPost from './components/diary/DiaryPost'
import type { TabId } from './types'

// recharts を含むため遅延読み込みにして main bundle を膨らませない
const StatsPage = lazy(() => import('./components/stats/StatsPage'))

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [selectedLeague, setSelectedLeague] = useState('all')
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [selectedDiaryDate, setSelectedDiaryDate] = useState<string | null>(null)

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    setSelectedCharacter(null)
    setSelectedDiaryDate(null)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard selectedLeague={selectedLeague} onTabChange={handleTabChange} />

      case 'characters':
        if (selectedCharacter) {
          return (
            <CharacterDetail
              name={selectedCharacter}
              onBack={() => setSelectedCharacter(null)}
            />
          )
        }
        return (
          <CharacterList
            selectedLeague={selectedLeague}
            onSelect={setSelectedCharacter}
          />
        )

      case 'leagues':
        return <LeagueHistory selectedLeague={selectedLeague} />

      case 'stats':
        return (
          <Suspense fallback={<p className="text-sm text-text-muted">Loading stats...</p>}>
            <StatsPage selectedLeague={selectedLeague} />
          </Suspense>
        )

      case 'diary':
        if (selectedDiaryDate) {
          return (
            <DiaryPost
              date={selectedDiaryDate}
              onBack={() => setSelectedDiaryDate(null)}
            />
          )
        }
        return (
          <DiaryList
            selectedLeague={selectedLeague}
            onSelect={setSelectedDiaryDate}
          />
        )
    }
  }

  return (
    <Layout
      activeTab={activeTab}
      selectedLeague={selectedLeague}
      onTabChange={handleTabChange}
      onLeagueChange={setSelectedLeague}
    >
      {renderContent()}
    </Layout>
  )
}
