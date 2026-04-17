// tests/composables/useVoiceInput.test.ts
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'

vi.mock('#imports', () => ({
  ref: vi.fn((v: any) => ({ value: v })),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  useI18n: vi.fn(() => ({ locale: { value: 'zh' } })),
}))

describe('useVoiceInput', () => {
  it('returns isSupported = false in non-browser environment', () => {
    const onResult = vi.fn()
    const { isSupported } = useVoiceInput(onResult)
    // In Node (test) environment, SpeechRecognition is not available
    expect(isSupported.value).toBe(false)
  })

  it('starts not recording', () => {
    const onResult = vi.fn()
    const { isRecording } = useVoiceInput(onResult)
    expect(isRecording.value).toBe(false)
  })
})
