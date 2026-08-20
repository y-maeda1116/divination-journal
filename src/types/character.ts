export interface Character {
  name: string
  league: string
  class: string
  ascendancy: string
  level: number
  experience: number
  fetchedAt: string
  // 旧 API の lastLoginTime を RFC3339 (UTC) に変換したもの。取得経路や
  // 旧ファイルによっては欠落する(表示側は undefined を「不明」と扱う)。
  lastLogin?: string
  items?: CharacterItems
  passives?: PassiveTree
}

export interface CharacterItems {
  weapon?: Item
  offhand?: Item
  helmet?: Item
  bodyArmour?: Item
  gloves?: Item
  boots?: Item
  belt?: Item
  ring1?: Item
  ring2?: Item
  amulet?: Item
  flasks?: Item[]
}

export interface Item {
  name: string
  typeLine: string
  rarity: string
  icon: string
  itemLevel?: number
  requirements?: ItemRequirement[]
  explicitMods?: string[]
  implicitMods?: string[]
}

export interface ItemRequirement {
  name: string
  values: [string, number][]
}

export interface PassiveTree {
  hashes: number[]
  skillPoints: number
  banditChoice?: string
}
