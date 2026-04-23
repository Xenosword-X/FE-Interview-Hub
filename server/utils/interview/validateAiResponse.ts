// server/utils/interview/validateAiResponse.ts
import type { TurnResponse, Phase } from './types'

const PHASE_ORDER: Record<string, number> = {
  intro: 0, behavioral: 1, technical: 2, wrapup: 3,
}

export function validateAndCoerce(
  ai: TurnResponse,
  currentPhase: Phase,
  behavioralCount: number,
  technicalCount: number,
  usedQuestionIds: string[],
  poolIds: string[]
): TurnResponse {
  const result = { ...ai }

  if (PHASE_ORDER[result.nextPhase] < PHASE_ORDER[currentPhase]) {
    result.nextPhase = currentPhase as TurnResponse['nextPhase']
  }

  if (result.isFinal && (result.nextPhase !== 'wrapup' || behavioralCount < 2 || technicalCount < 3)) {
    result.isFinal = false
  }

  if (result.pickedQuestionId) {
    if (!poolIds.includes(result.pickedQuestionId) || usedQuestionIds.includes(result.pickedQuestionId)) {
      result.pickedQuestionId = null
      result.isGeneratedQuestion = true
    }
  }

  return result
}
