/**
 * ResultStep — no emoji, Unicode geometric icons, detail rows matching web v2.
 */
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { ResolvedTheme } from '../theme'
import type { VerifyLocale, VerifyResult, VerifyVerdict } from '../types'

interface Props {
  theme:   ResolvedTheme
  locale:  VerifyLocale
  result:  VerifyResult | null
  error:   string | null
  onRetry: () => void
}

// Unicode block characters — no emoji, render cleanly on all platforms
const ICON: Record<VerifyVerdict, string> = {
  pass:   '\u2714',   // ✔ heavy check mark
  fail:   '\u2718',   // ✘ heavy ballot X
  review: '\u29D6',   // ⧖ hourglass
}
const ICON_BG: Record<VerifyVerdict, string> = {
  pass:   '#dcfce7',
  fail:   '#fee2e2',
  review: '#fef9c3',
}
const ICON_COLOR: Record<VerifyVerdict, string> = {
  pass:   '#16a34a',
  fail:   '#dc2626',
  review: '#ca8a04',
}

export function ResultStep({ theme, locale, result, error, onRetry }: Props) {
  const s = styles(theme)

  if (!result) {
    return (
      <View style={s.container}>
        <View style={[s.iconBox, { backgroundColor: ICON_BG.fail }]}>
          <Text style={[s.icon, { color: ICON_COLOR.fail }]}>{ICON.fail}</Text>
        </View>
        <Text style={s.title}>{locale.result_fail_title}</Text>
        <Text style={s.body}>{error ?? locale.result_fail_body}</Text>
        <TouchableOpacity style={s.btn} onPress={onRetry} activeOpacity={0.85}>
          <Text style={s.btnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const v = result.verdict
  const titles: Record<VerifyVerdict, string> = {
    pass:   locale.result_pass_title,
    fail:   locale.result_fail_title,
    review: locale.result_review_title,
  }
  const bodies: Record<VerifyVerdict, string> = {
    pass:   locale.result_pass_body,
    fail:   locale.result_fail_body,
    review: locale.result_review_body,
  }

  const rows: Array<{ label: string; value: string; ok?: boolean; bad?: boolean }> = [
    { label: 'Verdict',    value: v.charAt(0).toUpperCase() + v.slice(1), ok: v === 'pass', bad: v === 'fail' },
    { label: 'Risk score', value: String(result.score ?? '—') },
    { label: 'Face match', value: result.faceMatch ? 'Confirmed' : 'Not confirmed', ok: result.faceMatch, bad: !result.faceMatch },
    { label: 'Liveness',   value: result.isLive    ? 'Confirmed' : 'Not confirmed', ok: result.isLive,    bad: !result.isLive },
  ]

  return (
    <View style={s.container}>
      <View style={[s.iconBox, { backgroundColor: ICON_BG[v] }]}>
        <Text style={[s.icon, { color: ICON_COLOR[v] }]}>{ICON[v]}</Text>
      </View>
      <Text style={s.title}>{titles[v]}</Text>
      <Text style={s.body}>{bodies[v]}</Text>

      <View style={s.details}>
        {rows.map((row) => (
          <View key={row.label} style={s.row}>
            <Text style={s.rowLabel}>{row.label}</Text>
            <Text style={[
              s.rowVal,
              row.ok  && s.rowOk,
              row.bad && s.rowBad,
            ]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {v === 'fail' && (
        <TouchableOpacity style={s.btn} onPress={onRetry} activeOpacity={0.85}>
          <Text style={s.btnText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = (t: ResolvedTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 28,
      alignItems: 'center',
      gap: 14,
      justifyContent: 'center',
    },
    iconBox: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    icon: {
      fontSize: 22,
      fontWeight: '700',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: t.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    body: {
      fontSize: 13.5,
      color: t.subtext,
      textAlign: 'center',
      lineHeight: 19,
    },
    details: {
      width: '100%',
      gap: 6,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 12,
      backgroundColor: t.surface,
      borderRadius: 8,
    },
    rowLabel: {
      fontSize: 12.5,
      color: t.subtext,
    },
    rowVal: {
      fontSize: 12.5,
      fontWeight: '600',
      color: t.text,
    },
    rowOk:  { color: '#16a34a' },
    rowBad: { color: '#dc2626' },
    btn: {
      width: '100%',
      backgroundColor: t.accent,
      borderRadius: t.radius - 4,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 4,
    },
    btnText: {
      color: t.accentInv,
      fontSize: 14,
      fontWeight: '600',
    },
  })
