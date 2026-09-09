import type { VerifyTheme } from './types'

export interface ResolvedTheme {
  accent:     string
  accentInv:  string
  bg:         string
  surface:    string
  surface2:   string
  text:       string
  subtext:    string
  border:     string
  errorBg:    string
  errorText:  string
  radius:     number
}

export function resolveTheme(theme?: VerifyTheme): ResolvedTheme {
  const dark = theme?.mode === 'dark'
  return {
    accent:    theme?.accentColor     ?? (dark ? '#e5e7eb' : '#111827'),
    accentInv: dark ? '#111827' : '#ffffff',
    bg:        theme?.backgroundColor ?? (dark ? '#0f0f0f' : '#ffffff'),
    surface:   theme?.cardColor       ?? (dark ? '#1a1a1a' : '#f7f7f7'),
    surface2:  dark ? '#242424' : '#efefef',
    text:      theme?.textColor       ?? (dark ? '#f5f5f5' : '#0f0f0f'),
    subtext:   theme?.subtextColor    ?? (dark ? '#888888' : '#6b7280'),
    border:    theme?.borderColor     ?? (dark ? '#2a2a2a' : '#e5e5e5'),
    errorBg:   dark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
    errorText: dark ? '#f87171' : '#b91c1c',
    radius:    theme?.borderRadius    ?? 14,
  }
}
