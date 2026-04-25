// server/utils/interview/validateAiResponse.ts
import type { TurnResponse, Phase } from './types'

export const BEHAVIORAL_LIMIT = 3
export const TECHNICAL_LIMIT = 4

export interface UpcomingTurnPlan {
  phase: Exclude<Phase, 'completed' | 'aborted' | 'intro'>
  progressCurrent: number
  progressTotalInPhase: number
  isFinal: boolean
  isLastInPhase: boolean
}

/**
 * Deterministically compute what the next AI turn should be, based purely on how many
 * AI turns are already in the DB. The AI is unreliable at advancing phase/progress
 * itself (especially small models), so we plan the structure server-side and only
 * use the AI to generate the reply text.
 *
 * Layout (after the greeting at turn 0):
 *   - 3 behavioral
 *   - 4 technical
 *   - 1 wrapup
 *
 * @param existingAssistantTurns total AI turns currently in DB (greeting included)
 */
export function planUpcomingTurn(existingAssistantTurns: number): UpcomingTurnPlan {
  // 1-indexed position after the greeting.
  // existingAssistantTurns=1 (just greeting) → this is the 1st behavioral turn.
  const n = existingAssistantTurns

  if (n <= BEHAVIORAL_LIMIT) {
    return {
      phase: 'behavioral',
      progressCurrent: n,
      progressTotalInPhase: BEHAVIORAL_LIMIT,
      isFinal: false,
      isLastInPhase: n === BEHAVIORAL_LIMIT,
    }
  }
  if (n <= BEHAVIORAL_LIMIT + TECHNICAL_LIMIT) {
    const i = n - BEHAVIORAL_LIMIT
    return {
      phase: 'technical',
      progressCurrent: i,
      progressTotalInPhase: TECHNICAL_LIMIT,
      isFinal: false,
      isLastInPhase: i === TECHNICAL_LIMIT,
    }
  }
  return {
    phase: 'wrapup',
    progressCurrent: 1,
    progressTotalInPhase: 1,
    isFinal: true,
    isLastInPhase: true,
  }
}

export function validateAndCoerce(
  ai: TurnResponse,
  plan: UpcomingTurnPlan,
  usedQuestionIds: string[],
  poolIds: string[]
): TurnResponse {
  // Phase, progress, and isFinal are server-authoritative; AI's values are ignored.
  const result: TurnResponse = {
    ...ai,
    nextPhase: plan.phase,
    progressCurrent: plan.progressCurrent,
    progressTotalInPhase: plan.progressTotalInPhase,
    isFinal: plan.isFinal,
  }

  if (result.pickedQuestionId) {
    if (!poolIds.includes(result.pickedQuestionId) || usedQuestionIds.includes(result.pickedQuestionId)) {
      result.pickedQuestionId = null
      result.isGeneratedQuestion = true
    }
  }

  // Only technical phase should reference a question_id. Drop stray IDs from other phases.
  if (plan.phase !== 'technical') {
    result.pickedQuestionId = null
    result.isGeneratedQuestion = false
  }

  return result
}
