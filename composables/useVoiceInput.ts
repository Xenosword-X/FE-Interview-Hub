// composables/useVoiceInput.ts
// Web Speech API composable — SSR safe (initialised only in onMounted)

export function useVoiceInput(onResult: (text: string) => void) {
  const isRecording = ref(false)
  const isSupported = ref(false)

  let recognition: any = null
  let i18nLocale: { value: string } | null = null

  onMounted(() => {
    // useI18n must be resolved lazily inside onMounted to support SSR and test environments
    i18nLocale = useI18n().locale

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    isSupported.value = !!SpeechRecognition
    if (!SpeechRecognition) return

    recognition = new SpeechRecognition()
    recognition.continuous     = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }

    recognition.onend = () => {
      isRecording.value = false
    }

    recognition.onerror = () => {
      isRecording.value = false
    }
  })

  onUnmounted(() => {
    if (recognition && isRecording.value) recognition.abort()
  })

  function start() {
    if (!recognition || isRecording.value) return
    const localeValue = i18nLocale?.value ?? 'en'
    recognition.lang = localeValue === 'zh' ? 'zh-TW' : 'en-US'
    recognition.start()
    isRecording.value = true
  }

  function stop() {
    if (!recognition || !isRecording.value) return
    recognition.stop()
  }

  return { isRecording, isSupported, start, stop }
}
