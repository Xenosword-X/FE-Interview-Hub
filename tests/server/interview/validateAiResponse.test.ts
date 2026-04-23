// tests/server/interview/validateAiResponse.test.ts
import { describe, it, expect } from 'vitest'
import type { TurnResponse, Phase } from '../../../server/utils/interview/types'

const PHASE_ORDER: Record<string, number> = {
  intro: 0, behavioral: 1, technical: 2, wrapup: 3,
}

function validateAndCoerce(
  ai: TurnResponse,
  currentPhase: Phase,
  behavioralCount: number,
  technicalCount: number,
  usedQuestionIds: string[],
  poolIds: string[]
): TurnResponse {
  const result = { ...ai }

  // 1. nextPhase cannot go backward
  if (PHASE_ORDER[result.nextPhase] < PHASE_ORDER[currentPhase]) {
    result.nextPhase = currentPhase as TurnResponse['nextPhase']
  }

  // 2. isFinal only valid in wrapup with minimum questions asked
  if (result.isFinal && (result.nextPhase !== 'wrapup' || behavioralCount < 2 || technicalCount < 3)) {
    result.isFinal = false
  }

  // 3. pickedQuestionId must be in pool and not already used
  if (result.pickedQuestionId) {
    if (!poolIds.includes(result.pickedQuestionId) || usedQuestionIds.includes(result.pickedQuestionId)) {
      result.pickedQuestionId = null
      result.isGeneratedQuestion = true
    }
  }

  return result
}

describe('validateAndCoerce', () => {
  const base: TurnResponse = {
    reply: 'hello',
    nextPhase: 'behavioral',
    pickedQuestionId: null,
    isGeneratedQuestion: false,
    progressCurrent: 1,
    progressTotalInPhase: 3,
    isFinal: false,
  }

  it('prevents nextPhase from going backward', () => {
    const result = validateAndCoerce(
      { ...base, nextPhase: 'intro' },
      'behavioral', 0, 0, [], []
    )
    expect(result.nextPhase).toBe('behavioral')
  })

  it('clears isFinal when not enough questions asked', () => {
    const result = validateAndCoerce(
      { ...base, nextPhase: 'wrapup', isFinal: true },
      'technical', 1, 2, [], [] // behavioral < 2, technical < 3
    )
    expect(result.isFinal).toBe(false)
  })

  it('allows isFinal when conditions met', () => {
    const result = validateAndCoerce(
      { ...base, nextPhase: 'wrapup', isFinal: true },
      'wrapup', 2, 3, [], []
    )
    expect(result.isFinal).toBe(true)
  })

  it('clears pickedQuestionId when not in pool', () => {
    const result = validateAndCoerce(
      { ...base, pickedQuestionId: 'q99' },
      'technical', 0, 0, [], ['q1', 'q2']
    )
    expect(result.pickedQuestionId).toBeNull()
    expect(result.isGeneratedQuestion).toBe(true)
  })

  it('clears pickedQuestionId when already used', () => {
    const result = validateAndCoerce(
      { ...base, pickedQuestionId: 'q1' },
      'technical', 0, 0, ['q1'], ['q1', 'q2']
    )
    expect(result.pickedQuestionId).toBeNull()
    expect(result.isGeneratedQuestion).toBe(true)
  })
})
