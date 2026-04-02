package models

type League struct {
	ID          string      `json:"id"`
	Realm       string      `json:"realm"`
	URL         string      `json:"url"`
	StartAt     *string     `json:"startAt"`
	EndAt       *string     `json:"endAt"`
	Characters  []string    `json:"characters"`
	Description string      `json:"description,omitempty"`
	Goals       []LeagueGoal `json:"goals,omitempty"`
}

type LeagueGoal struct {
	Label    string `json:"label"`
	Achieved bool   `json:"achieved"`
}

type APILeague struct {
	ID      string  `json:"id"`
	Realm   string  `json:"realm"`
	URL     string  `json:"url"`
	StartAt *string `json:"startAt"`
	EndAt   *string `json:"endAt"`
}
