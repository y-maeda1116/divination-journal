import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './format'

const NOW = new Date('2026-08-20T12:00:00Z').getTime()

describe('formatRelativeTime', () => {
  it('未来の時刻は Just now にクランプする', () => {
    expect(formatRelativeTime('2026-08-20T12:00:30Z', NOW)).toBe('Just now')
  })

  it('1分未満前は Just now', () => {
    expect(formatRelativeTime('2026-08-20T11:59:31Z', NOW)).toBe('Just now')
  })

  it('1時間未満前は分表示', () => {
    expect(formatRelativeTime('2026-08-20T11:30:00Z', NOW)).toBe('30m ago')
    expect(formatRelativeTime('2026-08-20T11:00:01Z', NOW)).toBe('59m ago')
  })

  it('当日中の1時間以上前は時間表示', () => {
    expect(formatRelativeTime('2026-08-20T02:00:00Z', NOW)).toBe('10h ago')
  })

  it('暦日で前日は Yesterday(経過時間が24時間未満でも)', () => {
    expect(formatRelativeTime('2026-08-19T13:00:00Z', NOW)).toBe('Yesterday')
  })

  it('2日以上前は日数表示', () => {
    expect(formatRelativeTime('2026-08-11T12:00:00Z', NOW)).toBe('9d ago')
  })

  it('30日以上前は月表示', () => {
    expect(formatRelativeTime('2026-05-20T12:00:00Z', NOW)).toBe('3mo ago')
  })

  it('1年以上前は年表示', () => {
    expect(formatRelativeTime('2024-08-20T12:00:00Z', NOW)).toBe('2y ago')
  })

  it('パースできない文字列は Unknown', () => {
    expect(formatRelativeTime('not-a-date', NOW)).toBe('Unknown')
  })
})
