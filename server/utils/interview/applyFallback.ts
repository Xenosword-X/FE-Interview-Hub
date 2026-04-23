// server/utils/interview/applyFallback.ts

export const FALLBACK_REPLIES = {
  zh: '抱歉我好像沒聽清楚，可以再說一次嗎？',
  en: "Sorry, I didn't catch that. Could you please say it again?",
} as const

export function isSilentTranscript(transcript: string): boolean {
  return transcript.trim().length < 3
}
