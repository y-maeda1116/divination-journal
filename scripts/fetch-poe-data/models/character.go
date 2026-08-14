package models

import "time"

type Character struct {
	Name       string    `json:"name"`
	League     string    `json:"league"`
	Class      string    `json:"class"`
	Ascendancy string    `json:"ascendancy"`
	Level      int       `json:"level"`
	Experience int64     `json:"experience"`
	FetchedAt  string    `json:"fetchedAt"`
	Items      *Items    `json:"items,omitempty"`
	Passives   *Passives `json:"passives,omitempty"`
}

type Items struct {
	Weapon     *Item  `json:"weapon,omitempty"`
	Offhand    *Item  `json:"offhand,omitempty"`
	Helmet     *Item  `json:"helmet,omitempty"`
	BodyArmour *Item  `json:"bodyArmour,omitempty"`
	Gloves     *Item  `json:"gloves,omitempty"`
	Boots      *Item  `json:"boots,omitempty"`
	Belt       *Item  `json:"belt,omitempty"`
	Ring1      *Item  `json:"ring1,omitempty"`
	Ring2      *Item  `json:"ring2,omitempty"`
	Amulet     *Item  `json:"amulet,omitempty"`
	Flasks     []Item `json:"flasks,omitempty"`
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
	Hashes []int `json:"hashes"`
	// SkillPoints は OAuth2 API が提供しないため常に空(旧 API の名残でフィールドのみ残す)。
	SkillPoints  int    `json:"skillPoints,omitempty"`
	BanditChoice string `json:"banditChoice,omitempty"`
}

// APICharacter は OAuth2 API (GET /character) のキャラクターオブジェクト。
// 旧 character-window API と異なり OAuth2 では ascendancy が返らないため、
// POESESSID 経路でのみ設定される(omitempty)。
type APICharacter struct {
	ID         string `json:"id,omitempty"`
	Name       string `json:"name"`
	Realm      string `json:"realm,omitempty"`
	Class      string `json:"class"`
	League     string `json:"league"`
	Level      int    `json:"level"`
	Experience int64  `json:"experience"`
	Ascendancy string `json:"ascendancy,omitempty"`
}

// APICharacters は GET /character のラッパーオブジェクト。
type APICharacters struct {
	Characters []APICharacter `json:"characters"`
}

// APIItemMod は OAuth2 API の modifier オブジェクト(description のみ使用)。
type APIItemMod struct {
	Description string `json:"description"`
}

// APIItem は OAuth2 API (GET /character/{name}) のアイテムオブジェクト。
// rarity は文字列("Rare" 等)、mods は ItemMod オブジェクト配列。
type APIItem struct {
	Name         string       `json:"name"`
	TypeLine     string       `json:"typeLine"`
	Rarity       string       `json:"rarity"`
	Icon         string       `json:"icon"`
	ItemLevel    int          `json:"ilvl"`
	ExplicitMods []APIItemMod `json:"explicitMods,omitempty"`
	ImplicitMods []APIItemMod `json:"implicitMods,omitempty"`
	InventoryID  string       `json:"inventoryId"`
}

// APICharacterItems は GET /character/{name} のレスポンス。
type APICharacterItems struct {
	Character struct {
		ID        string    `json:"id"`
		Name      string    `json:"name"`
		Class     string    `json:"class"`
		League    string    `json:"league"`
		Level     int       `json:"level"`
		Equipment []APIItem `json:"equipment"`
		Passives  struct {
			Hashes       []int  `json:"hashes"`
			BanditChoice string `json:"bandit_choice"`
		} `json:"passives"`
	} `json:"character"`
}

func NowUTC() string {
	return time.Now().UTC().Format(time.RFC3339)
}
