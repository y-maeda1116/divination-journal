package models

import "time"

type Character struct {
	Name       string `json:"name"`
	League     string `json:"league"`
	Class      string `json:"class"`
	Ascendancy string `json:"ascendancy"`
	Level      int    `json:"level"`
	Experience int64  `json:"experience"`
	FetchedAt  string `json:"fetchedAt"`
	Items      *Items `json:"items,omitempty"`
	Passives   *Passives `json:"passives,omitempty"`
}

type Items struct {
	Weapon     *Item   `json:"weapon,omitempty"`
	Offhand    *Item   `json:"offhand,omitempty"`
	Helmet     *Item   `json:"helmet,omitempty"`
	BodyArmour *Item   `json:"bodyArmour,omitempty"`
	Gloves     *Item   `json:"gloves,omitempty"`
	Boots      *Item   `json:"boots,omitempty"`
	Belt       *Item   `json:"belt,omitempty"`
	Ring1      *Item   `json:"ring1,omitempty"`
	Ring2      *Item   `json:"ring2,omitempty"`
	Amulet     *Item   `json:"amulet,omitempty"`
	Flasks     []Item  `json:"flasks,omitempty"`
}

type Item struct {
	Name         string   `json:"name"`
	TypeLine     string   `json:"typeLine"`
	Rarity       string   `json:"rarity"`
	Icon         string   `json:"icon"`
	ItemLevel    int      `json:"itemLevel,omitempty"`
	ExplicitMods []string `json:"explicitMods,omitempty"`
	ImplicitMods []string `json:"implicitMods,omitempty"`
}

type Passives struct {
	Hashes      []int  `json:"hashes"`
	SkillPoints int    `json:"skillPoints"`
	BanditChoice string `json:"banditChoice,omitempty"`
}

type APICharacter struct {
	Name       string `json:"name"`
	League     string `json:"league"`
	Class      string `json:"class"`
	Ascendancy string `json:"ascendancy"`
	Level      int    `json:"level"`
	Experience int64  `json:"experience"`
	ClassID    int    `json:"classId"`
}

type APICharacterItems struct {
	CharacterName string `json:"characterName"`
	Items         []struct {
		Name         string   `json:"name"`
		TypeLine     string   `json:"typeLine"`
		Rarity       int      `json:"frameType"`
		Icon         string   `json:"icon"`
		ItemLevel    int      `json:"ilvl"`
		ExplicitMods []string `json:"explicitMods,omitempty"`
		ImplicitMods []string `json:"implicitMods,omitempty"`
		InventoryID  string   `json:"inventoryId"`
	} `json:"items"`
	Passives struct {
		Hashes      []int  `json:"hashes"`
		SkillPoints int    `json:"skillPoints"`
	} `json:"passives"`
}

func NowUTC() string {
	return time.Now().UTC().Format(time.RFC3339)
}
