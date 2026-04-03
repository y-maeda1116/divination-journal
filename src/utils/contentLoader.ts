import type { Character } from '../types/character'
import type { League } from '../types/league'
import type { DiaryEntry, DiaryMeta } from '../types/diary'

const characterModules = import.meta.glob<Character>('/content/characters/*.json', {
  eager: true,
  query: '?url',
  import: 'default',
})

const leagueModules = import.meta.glob<League>('/content/leagues/*.json', {
  eager: true,
  query: '?url',
  import: 'default',
})

const diaryModules = import.meta.glob<string>('/content/diary/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export function loadCharacters(): Character[] {
  return Object.entries(characterModules).map(([, data]) => data)
}

export function loadCharacterByName(name: string): Character | undefined {
  return loadCharacters().find((c) => c.name === name)
}

export function loadLeagues(): League[] {
  return Object.entries(leagueModules).map(([, data]) => data)
}

export function loadLeagueById(id: string): League | undefined {
  return loadLeagues().find((l) => l.id === id)
}

export function loadDiaryEntries(): DiaryEntry[] {
  return Object.entries(diaryModules)
    .map(([path, raw]) => parseDiaryEntry(path, raw))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function loadDiaryByDate(date: string): DiaryEntry | undefined {
  return loadDiaryEntries().find((e) => e.date === date)
}

function parseDiaryEntry(path: string, raw: string): DiaryEntry {
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

  if (!frontmatterMatch) {
    const fileName = path.split('/').pop()?.replace('.md', '') ?? ''
    return {
      title: fileName,
      date: '1970-01-01',
      league: '',
      character: '',
      tags: [],
      content: raw,
    }
  }

  const [, frontmatterText, content] = frontmatterMatch
  const meta = parseFrontmatter(frontmatterText)

  return {
    ...meta,
    content: content.trim(),
  }
}

function parseFrontmatter(text: string): DiaryMeta {
  const meta: DiaryMeta = {
    title: '',
    date: '',
    league: '',
    character: '',
    tags: [],
  }

  const lines = text.split('\n')
  for (const line of lines) {
    const [key, ...rest] = line.split(':')
    const value = rest.join(':').trim()

    switch (key.trim()) {
      case 'title':
        meta.title = value.replace(/^["']|["']$/g, '')
        break
      case 'date':
        meta.date = value.replace(/^["']|["']$/g, '')
        break
      case 'league':
        meta.league = value.replace(/^["']|["']$/g, '')
        break
      case 'character':
        meta.character = value.replace(/^["']|["']$/g, '')
        break
      case 'tags': {
        const tagsStr = value.replace(/^\[|\]$/g, '')
        meta.tags = tagsStr.split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''))
        break
      }
    }
  }

  return meta
}
