import type { VerifyTheme } from './types'

export interface ResolvedTheme {
  accent: string
  bg: string
  text: string
  subtext: string
  border: string
  card: string
  radius: number
}

export function resolveTheme(theme?: VerifyTheme): ResolvedTheme {
  const dark = theme?.mode === 'dark'
  return {
    accent:  theme?.accentColor     ?? '#111827',
    bg:      theme?.backgroundColor ?? (dark ? '#1a1a2e' : '#ffffff'),
    text:    theme?.textColor       ?? (dark ? '#f9fafb' : '#111827'),
    subtext: theme?.subtextColor    ?? (dark ? '#9ca3af' : '#6b7280'),
    border:  theme?.borderColor     ?? (dark ? '#374151' : '#e5e7eb'),
    card:    theme?.cardColor       ?? (dark ? '#111827' : '#f9fafb'),
    radius:  theme?.borderRadius    ?? 12,
  }
}
