// server/utils/interview/buildTurnMessages.ts
import type { InterviewTurn } from './types'

export function buildTurnMessages(
  systemPrompt: string,
  turns: Pick<InterviewTurn, 'role' | 'content'>[],
  newUserContent: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]
  for (const turn of turns) {
    messages.push({ role: turn.role as 'user' | 'assistant', content: turn.content })
  }
  messages.push({ role: 'user', content: newUserContent })
  return messages
}
