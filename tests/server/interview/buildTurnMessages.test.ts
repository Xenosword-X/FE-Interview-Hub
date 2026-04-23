// tests/server/interview/buildTurnMessages.test.ts
import { describe, it, expect } from 'vitest'
import { buildTurnMessages } from '../../../server/utils/interview/buildTurnMessages'

describe('buildTurnMessages', () => {
  it('starts with system message', () => {
    const msgs = buildTurnMessages('system', [], 'hello')
    expect(msgs[0]).toEqual({ role: 'system', content: 'system' })
  })

  it('appends turn history in order', () => {
    const turns = [
      { role: 'assistant' as const, content: 'question' },
      { role: 'user' as const, content: 'answer' },
    ]
    const msgs = buildTurnMessages('sys', turns, 'new')
    expect(msgs[1]).toEqual({ role: 'assistant', content: 'question' })
    expect(msgs[2]).toEqual({ role: 'user', content: 'answer' })
  })

  it('ends with new user message', () => {
    const msgs = buildTurnMessages('sys', [], 'latest user input')
    expect(msgs[msgs.length - 1]).toEqual({ role: 'user', content: 'latest user input' })
  })

  it('total length = 1 system + N turns + 1 new user', () => {
    const turns = [{ role: 'assistant' as const, content: 'q' }]
    const msgs = buildTurnMessages('sys', turns, 'a')
    expect(msgs).toHaveLength(3)
  })
})
