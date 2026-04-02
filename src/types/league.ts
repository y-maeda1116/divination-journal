export interface League {
  id: string
  realm: string
  url: string
  startAt: string | null
  endAt: string | null
  characters: string[]
  description?: string
  goals?: LeagueGoal[]
}

export interface LeagueGoal {
  label: string
  achieved: boolean
}
