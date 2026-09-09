/**
 * <KernaqVerify /> — drop-in identity verification modal for React Native (v2).
 *
 * Matches @kernaq/verify web v2.0.0:
 *   - No header / logo
 *   - No progress bar
 *   - No cancel/close button — user must complete the flow
 *   - Front + back document capture
 *   - Auto-capture selfie with guidance pill
 *   - Randomised liveness tasks with in-viewport overlay
 *   - Configurable steps prop
 *   - "Secured by Kernaq" footer only
 *
 * Usage:
 *   <KernaqVerify
 *     visible={show}
 *     documentType="national_id"
 *     country="KEN"
 *     reference={userId}
 *     steps={['document', 'selfie', 'liveness']}
 *     onComplete={(r) => console.log(r.verdict)}
 *   />
 */
import React, { useState, useCallback, useMemo } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native'
import { DEFAULT_LOCALE } from './locale'
import { resolveTheme } from './theme'
import { usePermissions } from './hooks/usePermissions'
import { IntroStep }      from './steps/IntroStep'
import { DocumentStep }   from './steps/DocumentStep'
import { SelfieStep }     from './steps/SelfieStep'
import { LivenessStep }   from './steps/LivenessStep'
import { ProcessingStep } from './steps/ProcessingStep'
import { ResultStep }     from './steps/ResultStep'
import type {
  VerifyConfig, VerifyStep, VerifyResult, VerifyLocale, VerifyStepName,
} from './types'

interface Props extends VerifyConfig {
  visible: boolean
}

type CaptureState = {
  docFrontUri?: string
  docBackUri?:  string
  selfieUri?:   string
  videoUri?:    string
}

export function KernaqVerify({
  visible,
  apiKey,
  backendUrl,
  country        = 'KEN',
  reference,
  sandbox        = false,
  livenessDuration = 3000,
  livenessTaskCount = 2,
  documentType   = 'national_id',
  steps: stepsProp,
  theme: themeProp,
  locale: localeProp,
  onComplete,
  onError,
}: Props) {
  const [step,    setStep]    = useState<VerifyStep>('intro')
  const [capture, setCapture] = useState<CaptureState>({})
  const [result,  setResult]  = useState<VerifyResult | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const theme = useMemo(() => resolveTheme(themeProp), [themeProp])
  const locale: VerifyLocale = useMemo(() => ({ ...DEFAULT_LOCALE, ...localeProp }), [localeProp])
  const { requestPermissions } = usePermissions()
  const s = styles(theme)

  // Build the ordered flow from the steps prop
  const flow = useMemo((): VerifyStep[] => {
    const wanted = stepsProp ?? ['document', 'selfie', 'liveness'] as VerifyStepName[]
    const out: VerifyStep[] = []
    if (wanted.includes('document')) { out.push('doc-front'); out.push('doc-back') }
    if (wanted.includes('selfie'))   out.push('selfie')
    if (wanted.includes('liveness')) out.push('liveness')
    out.push('processing')
    return out
  }, [stepsProp])

  const next = useCallback((current: VerifyStep) => {
    const idx = flow.indexOf(current)
    const nextStep = flow[idx + 1] ?? 'processing'
    goto(nextStep)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow])

  const goto = useCallback(async (s: VerifyStep) => {
    if (s === 'doc-front' || s === 'doc-back' || s === 'selfie' || s === 'liveness') {
      const granted = await requestPermissions()
      if (!granted) { setError(locale.error_camera_denied); return }
    }
    setStep(s)
    if (s === 'processing') submit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture, locale])

  const reset = useCallback(() => {
    setStep('intro')
    setCapture({})
    setResult(null)
    setError(null)
  }, [])

  const submit = useCallback(async () => {
    const { docFrontUri, docBackUri, selfieUri, videoUri } = capture
    if (!docFrontUri && !selfieUri) {
      // At least one capture needed depending on steps
    }

    const base = (backendUrl ?? 'https://api.identity.kernaq.com/v1').replace(/\/$/, '')
    const form = new FormData()

    if (docFrontUri) {
      form.append('document', { uri: docFrontUri, name: 'doc_front.jpg', type: 'image/jpeg' } as any)
    }
    if (docBackUri) {
      form.append('document_back', { uri: docBackUri, name: 'doc_back.jpg', type: 'image/jpeg' } as any)
    }
    if (selfieUri) {
      form.append('selfie', { uri: selfieUri, name: 'selfie.jpg', type: 'image/jpeg' } as any)
    }
    if (videoUri) {
      form.append('video', { uri: videoUri, name: 'liveness.mp4', type: 'video/mp4' } as any)
    }

    form.append('document_type', documentType)
    form.append('country',       country)
    form.append('reference',     reference ?? `kq_${Date.now()}`)
    if (sandbox) form.append('sandbox', 'true')

    const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' }
    if (apiKey) headers['X-API-Key'] = apiKey

    try {
      const res  = await fetch(`${base}/verify`, { method: 'POST', headers, body: form })
      const body = (await res.json()) as Record<string, unknown>
      if (!res.ok) throw new Error((body['message'] as string) ?? `HTTP ${res.status}`)

      const r: VerifyResult = {
        verificationId: body['verification_id'] as string,
        reference:      body['reference']       as string,
        verdict:        body['verdict']         as 'pass' | 'fail' | 'review',
        score:          (body['score']          as number) ?? 0,
        faceMatch:      (body['face_match']     as boolean) ?? false,
        isLive:         (body['is_live']        as boolean) ?? false,
        documentFields: body['document_fields'] as Record<string, string> | undefined,
      }
      setResult(r)
      setStep('result')
      onComplete?.(r)
    } catch (err) {
      const msg = (err as Error).message
      setError(`${locale.error_network} ${msg}`)
      setResult(null)
      setStep('result')
      onError?.({ code: 'network_error', message: msg })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {/* intentionally empty — user cannot dismiss */}}
    >
      <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>

        {/* ── Content ── */}
        <View style={s.body}>
          {step === 'intro' && (
            <IntroStep
              theme={theme}
              locale={locale}
              onStart={() => {
                const first = flow[0]
                if (first) goto(first)
              }}
            />
          )}

          {step === 'doc-front' && (
            <DocumentStep
              theme={theme}
              locale={locale}
              side="front"
              onCapture={(uri) => {
                setCapture(c => ({ ...c, docFrontUri: uri }))
                next('doc-front')
              }}
            />
          )}

          {step === 'doc-back' && (
            <DocumentStep
              theme={theme}
              locale={locale}
              side="back"
              frontUri={capture.docFrontUri}
              onCapture={(uri) => {
                setCapture(c => ({ ...c, docBackUri: uri }))
                next('doc-back')
              }}
              onRetakeFront={() => {
                setCapture(c => ({ ...c, docFrontUri: undefined }))
                goto('doc-front')
              }}
            />
          )}

          {step === 'selfie' && (
            <SelfieStep
              theme={theme}
              locale={locale}
              onCapture={(uri) => {
                setCapture(c => ({ ...c, selfieUri: uri }))
                next('selfie')
              }}
            />
          )}

          {step === 'liveness' && (
            <LivenessStep
              theme={theme}
              locale={locale}
              duration={livenessDuration}
              taskCount={livenessTaskCount}
              onCapture={(uri) => {
                setCapture(c => ({ ...c, videoUri: uri }))
                next('liveness')
              }}
            />
          )}

          {step === 'processing' && (
            <ProcessingStep theme={theme} locale={locale} />
          )}

          {step === 'result' && (
            <ResultStep
              theme={theme}
              locale={locale}
              result={result}
              error={error}
              onRetry={() => { reset(); goto('intro') }}
            />
          )}
        </View>

        {/* ── Footer — Secured by Kernaq ── */}
        {step !== 'processing' && (
          <View style={s.footer}>
            <Text style={s.footerText}>Secured by </Text>
            <Text style={[s.footerText, { fontWeight: '600', color: theme.text }]}>Kernaq</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  )
}

const styles = (t: ReturnType<typeof resolveTheme>) =>
  StyleSheet.create({
    safe: {
      flex: 1,
    },
    body: {
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingBottom: Platform.OS === 'ios' ? 4 : 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
    },
    footerText: {
      fontSize: 11,
      color: t.subtext,
    },
  })
