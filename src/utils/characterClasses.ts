import type { Character } from '../types/character'

// アセンダンシー名 → 基礎クラスの対応表。
// 公式 Ascendancy Classes ページ(https://www.pathofexile.com/ascendancy/classes)
// 準拠。イベントリーグ限定のアセンダンシー(Herald 等)はここに載らないため
// baseClassOf が 'Other' にフォールバックする。
const ASCENDANCY_BASE_CLASS: Record<string, string> = {
  // Duelist
  Slayer: 'Duelist',
  Gladiator: 'Duelist',
  Champion: 'Duelist',
  // Shadow
  Assassin: 'Shadow',
  Saboteur: 'Shadow',
  Trickster: 'Shadow',
  // Marauder
  Juggernaut: 'Marauder',
  Berserker: 'Marauder',
  Chieftain: 'Marauder',
  // Witch
  Necromancer: 'Witch',
  Occultist: 'Witch',
  Elementalist: 'Witch',
  // Ranger
  Deadeye: 'Ranger',
  Warden: 'Ranger',
  Pathfinder: 'Ranger',
  // Templar
  Inquisitor: 'Templar',
  Hierophant: 'Templar',
  Guardian: 'Templar',
  // Scion
  Ascendant: 'Scion',
  Reliquarian: 'Scion',
  Luminary: 'Scion',
}

// 基礎クラスの表示順
const BASE_CLASSES = ['Witch', 'Marauder', 'Ranger', 'Duelist', 'Shadow', 'Templar', 'Scion']

export const OTHER_BASE_CLASS = 'Other'

export interface AscendancyGroup {
  ascendancy: string
  characters: Character[]
}

export interface ClassGroup {
  baseClass: string
  total: number
  ascendancies: AscendancyGroup[]
}

// キャラの実効アセンダンシー名。旧 API では class フィールドにアセンダンシー
// 昇順済みのキャラはアセンダンシー名、未昇順のキャラには基礎クラス名が入り、
// ascendancy フィールドはほぼ空のため、ascendancy を優先しつつ class で補う。
export function effectiveAscendancy(character: Character): string {
  return character.ascendancy || character.class
}

// キャラの基礎クラスを判定する。対応表 → 基礎クラス名そのもの → Other の順。
export function baseClassOf(character: Character): string {
  const name = effectiveAscendancy(character)
  return ASCENDANCY_BASE_CLASS[name] ?? (BASE_CLASSES.includes(name) ? name : OTHER_BASE_CLASS)
}

// キャラを基礎クラス → アセンダンシーの2階層にグループ化する。
// - 基礎クラス順: BASE_CLASSES の順 → Other は最後
// - 各基礎クラス内のアセンダンシー順: キャラ数降順 → 名前昇順
// - 各アセンダンシー内: レベル降順 → 同レベルは名前昇順
export function groupCharactersByClass(characters: Character[]): ClassGroup[] {
  const byBase = new Map<string, Map<string, Character[]>>()

  for (const character of characters) {
    const base = baseClassOf(character)
    if (!byBase.has(base)) {
      byBase.set(base, new Map())
    }
    const ascendancies = byBase.get(base)!
    const ascendancy = effectiveAscendancy(character)
    if (!ascendancies.has(ascendancy)) {
      ascendancies.set(ascendancy, [])
    }
    ascendancies.get(ascendancy)!.push(character)
  }

  const baseOrder = [...BASE_CLASSES, OTHER_BASE_CLASS]

  return [...byBase.entries()]
    .sort((a, b) => indexOrMax(baseOrder, a[0]) - indexOrMax(baseOrder, b[0]))
    .map(([baseClass, ascendancies]) => ({
      baseClass,
      total: [...ascendancies.values()].reduce((sum, list) => sum + list.length, 0),
      ascendancies: [...ascendancies.entries()]
        .map(([ascendancy, list]) => ({
          ascendancy,
          characters: [...list].sort(
            (a, b) => b.level - a.level || a.name.localeCompare(b.name),
          ),
        }))
        .sort(
          (a, b) =>
            b.characters.length - a.characters.length ||
            a.ascendancy.localeCompare(b.ascendancy),
        ),
    }))
}

function indexOrMax(order: string[], value: string): number {
  const index = order.indexOf(value)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
