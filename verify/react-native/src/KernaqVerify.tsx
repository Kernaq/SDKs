/**
 * <KernaqVerify /> — drop-in identity verification modal for React Native.
 *
 * Usage:
 *   import { KernaqVerify } from '@kernaq/verify-react-native'
 *
 *   <KernaqVerify
 *     visible={showVerify}
 *     apiKey="k_test_..."
 *     country="KEN"
 *     reference={userId}
 *     onComplete={(result) => console.log(result.verdict)}
 *     onCancel={() => setShowVerify(false)}
 *   />
 */
import React, { useState, useCallback, useMemo } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native'
import { DEFAULT_LOCALE } from './locale'
import { resolveTheme } from './theme'
import { usePermissions } from './hooks/usePermissions'
import { IntroStep } from './steps/IntroStep'
import { DocumentStep } from './steps/DocumentStep'
import { SelfieStep } from './steps/SelfieStep'
import { LivenessStep } from './steps/LivenessStep'
import { ProcessingStep } from './steps/ProcessingStep'
import { ResultStep } from './steps/ResultStep'
import type { VerifyConfig, VerifyStep, VerifyResult, VerifyLocale } from './types'

interface Props extends VerifyConfig {
  visible: boolean
}

type CaptureState = {
  documentUri?: string
  selfieUri?: string
  videoUri?: string
}

const STEP_INDEX: Record<VerifyStep, number> = {
  intro: -1,
  document: 0,
  selfie: 1,
  liveness: 2,
  processing: 3,
  result: 3,
}

export function KernaqVerify({
  visible,
  apiKey,
  backendUrl,
  country = 'KEN',
  reference,
  sandbox = false,
  livenessDuration = 3000,
  documentTypes = ['national_id', 'passport'],
  theme: themeProp,
  locale: localeProp,
  onCancel,
  onComplete,
  onError,
}: Props) {
  const [step, setStep] = useState<VerifyStep>('intro')
  const [capture, setCapture] = useState<CaptureState>({})
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const theme = useMemo(() => resolveTheme(themeProp), [themeProp])
  const locale: VerifyLocale = useMemo(
    () => ({ ...DEFAULT_LOCALE, ...localeProp }),
    [localeProp]
  )
  const { requestPermissions } = usePermissions()
  const s = styles(theme)

  const reset = useCallback(() => {
    setStep('intro')
    setCapture({})
    setResult(null)
    setError(null)
  }, [])

  const goto = useCallback(async (next: VerifyStep) => {
    if (next === 'document' || next === 'selfie' || next === 'liveness') {
      const granted = await requestPermissions()
      if (!granted) {
        setError(locale.error_camera_denied)
        return
      }
    }
    setStep(next)
    if (next === 'processing') {
      submit()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture, locale])

  const submit = useCallback(async () => {
    const { documentUri, selfieUri, videoUri } = capture
    if (!documentUri || !selfieUri) {
      setError('Missing captures — please restart.')
      setStep('result')
      return
    }

    const base = (backendUrl ?? 'https://api.identity.kernaq.com/v1').replace(/\/$/, '')
    const form = new FormData()

    form.append('document', {
      uri: documentUri,
      name: 'document.jpg',
      type: 'image/jpeg',
    } as unknown as Blob)

    form.append('selfie', {
      uri: selfieUri,
      name: 'selfie.jpg',
      type: 'image/jpeg',
    } as unknown as Blob)

    if (videoUri) {
      form.append('video', {
        uri: videoUri,
        name: 'liveness.mp4',
        type: 'video/mp4',
      } as unknown as Blob)
    }

    form.append('document_type', documentTypes[0] ?? 'national_id')
    form.append('country', country)
    form.append('reference', reference ?? `kq_${Date.now()}`)
    if (sandbox) form.append('sandbox', 'true')

    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    }
    if (apiKey) headers['X-API-Key'] = apiKey

    try {
      const res = await fetch(`${base}/verify`, {
        method: 'POST',
        headers,
        body: form,
      })
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
      setStep('result')
      onError?.({ code: 'network_error', message: msg })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture])

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  const progressSteps: VerifyStep[] = ['document', 'selfie', 'liveness', 'processing']
  const currentIdx = STEP_INDEX[step]

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={[s.safeArea, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>Kernaq</Text>
          {step !== 'processing' && (
            <TouchableOpacity onPress={handleCancel} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress bar */}
        {currentIdx >= 0 && (
          <View style={s.progress}>
            {progressSteps.map((_, i) => (
              <View
                key={i}
                style={[
                  s.progressDot,
                  i < currentIdx && { backgroundColor: theme.accent, opacity: 0.4 },
                  i === currentIdx && { backgroundColor: theme.accent },
                ]}
              />
            ))}
          </View>
        )}

        {/* Body */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {step === 'intro' && (
            <IntroStep
              theme={theme}
              locale={locale}
              onStart={() => goto('document')}
            />
          )}
          {step === 'document' && (
            <DocumentStep
              theme={theme}
              locale={locale}
              onCapture={(uri) => {
                setCapture((c) => ({ ...c, documentUri: uri }))
                goto('selfie')
              }}
            />
          )}
          {step === 'selfie' && (
            <SelfieStep
              theme={theme}
              locale={locale}
              onCapture={(uri) => {
                setCapture((c) => ({ ...c, selfieUri: uri }))
                goto('liveness')
              }}
              onBack={() => setStep('document')}
            />
          )}
          {step === 'liveness' && (
            <LivenessStep
              theme={theme}
              locale={locale}
              duration={livenessDuration}
              onCapture={(uri) => {
                setCapture((c) => ({ ...c, videoUri: uri }))
                goto('processing')
              }}
              onBack={() => setStep('selfie')}
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
              onRetry={() => {
                reset()
                setStep('intro')
              }}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = (t: ReturnType<typeof resolveTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 16 : 8,
      paddingBottom: 8,
    },
    logo: {
      fontSize: 14,
      fontWeight: '700',
      color: t.accent,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    closeBtn: {
      padding: 4,
    },
    closeText: {
      fontSize: 18,
      color: t.subtext,
    },
    progress: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    progressDot: {
      flex: 1,
      height: 3,
      borderRadius: 999,
      backgroundColor: t.border,
    },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1 },
  })
