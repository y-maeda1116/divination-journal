// formatRelativeTime は RFC3339 タイムスタンプを "3d ago" 形式の英語相対表記へ
// 変換する(UI 文言は英語で統一)。now はテストから固定値を注入できる。
// 暦日の差で Yesterday/Xd を判定するため、前日 23:59 → 当日 00:01 のような
// ケースでも暦日ベースの自然な表示になる。
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const time = Date.parse(iso)
  if (Number.isNaN(time)) {
    return 'Unknown'
  }

  const elapsed = now - time
  if (elapsed < 60_000) {
    return 'Just now'
  }
  if (elapsed < 3_600_000) {
    return `${Math.floor(elapsed / 60_000)}m ago`
  }

  const dayDiff = Math.floor(startOfUtcDay(now) - startOfUtcDay(time)) / 86_400_000
  if (dayDiff <= 0) {
    return `${Math.floor(elapsed / 3_600_000)}h ago`
  }
  if (dayDiff === 1) {
    return 'Yesterday'
  }
  if (dayDiff < 30) {
    return `${dayDiff}d ago`
  }
  if (dayDiff < 365) {
    return `${Math.floor(dayDiff / 30)}mo ago`
  }
  return `${Math.floor(dayDiff / 365)}y ago`
}

function startOfUtcDay(ms: number): number {
  return Math.floor(ms / 86_400_000) * 86_400_000
}
