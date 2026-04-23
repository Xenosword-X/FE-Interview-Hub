// server/utils/interview/types.ts

export type Phase = 'intro' | 'behavioral' | 'technical' | 'wrapup' | 'completed' | 'aborted'
export type SessionStatus = 'active' | 'completed' | 'aborted' | 'error'
export type TurnRole = 'assistant' | 'user'

export interface InterviewSession {
  id: string
  user_id: string
  locale: 'zh' | 'en'
  target_role: string
  target_categories: string[]
  phase: Phase
  status: SessionStatus
  started_at: string
  ended_at: string | null
  total_turns: number
  summary: InterviewSummary | null
  created_at: string
}

export interface InterviewTurn {
  id: string
  session_id: string
  turn_index: number
  role: TurnRole
  phase: Phase
  content: string
  audio_duration_sec: number | null
  question_id: string | null
  is_generated: boolean
  created_at: string
}

export interface InterviewSummary {
  overall: string
  strengths: string[]
  improvements: string[]
  studyAreas: string[]
  perQuestion: Array<{
    turnIndex: number
    question: string
    keyPoints: string[]
    feedback: string
  }>
}

export interface TurnResponse {
  reply: string
  nextPhase: Exclude<Phase, 'completed' | 'aborted'>
  pickedQuestionId: string | null
  isGeneratedQuestion: boolean
  progressCurrent: number
  progressTotalInPhase: number
  isFinal: boolean
}

export interface QuestionPoolItem {
  id: string
  title: string
  difficulty: string
  category: string
  used: boolean
}
