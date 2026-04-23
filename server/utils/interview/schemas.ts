// server/utils/interview/schemas.ts
// We use response_format: { type: 'json_object' } and manually validate,
// matching the project's existing pattern in evaluate.post.ts.
// This avoids Structured Outputs strict-mode nullable complications.

import type { TurnResponse, InterviewSummary } from './types'

export function parseTurnResponse(raw: string): TurnResponse {
  const obj = JSON.parse(raw)
  return {
    reply: String(obj.reply ?? ''),
    nextPhase: obj.nextPhase ?? 'behavioral',
    pickedQuestionId: obj.pickedQuestionId ?? null,
    isGeneratedQuestion: Boolean(obj.isGeneratedQuestion),
    progressCurrent: Number(obj.progressCurrent ?? 1),
    progressTotalInPhase: Number(obj.progressTotalInPhase ?? 3),
    isFinal: Boolean(obj.isFinal),
  }
}

export function parseSummaryResponse(raw: string): InterviewSummary {
  const obj = JSON.parse(raw)
  return {
    overall: String(obj.overall ?? ''),
    strengths: Array.isArray(obj.strengths) ? obj.strengths.map(String) : [],
    improvements: Array.isArray(obj.improvements) ? obj.improvements.map(String) : [],
    studyAreas: Array.isArray(obj.studyAreas) ? obj.studyAreas.map(String) : [],
    perQuestion: Array.isArray(obj.perQuestion)
      ? obj.perQuestion.map((q: any) => ({
          turnIndex: Number(q.turnIndex ?? 0),
          question: String(q.question ?? ''),
          keyPoints: Array.isArray(q.keyPoints) ? q.keyPoints.map(String) : [],
          feedback: String(q.feedback ?? ''),
        }))
      : [],
  }
}
