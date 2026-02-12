import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { createSession } from '@craft-agent/shared/sessions'
import { listLocalSessions, loadLocalSession } from './session-api'

let workspaceRoot: string

describe('local session api', () => {
  beforeEach(async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), 'craft-agent-web-'))
  })

  afterEach(async () => {
    if (workspaceRoot) {
      await rm(workspaceRoot, { recursive: true, force: true })
    }
  })

  it('lists sessions with recent activity first', async () => {
    const first = await createSession(workspaceRoot, { name: 'First session' })
    await new Promise(resolve => setTimeout(resolve, 5))
    const second = await createSession(workspaceRoot, { name: 'Second session' })

    const sessions = listLocalSessions(workspaceRoot)

    expect(sessions).toHaveLength(2)
    expect(sessions[0]?.id).toBe(second.id)
    expect(sessions[1]?.id).toBe(first.id)
    expect(sessions[0]?.name).toBe('Second session')
  })

  it('loads a stored session by id', async () => {
    const session = await createSession(workspaceRoot, { name: 'Loaded session' })

    const loaded = loadLocalSession(workspaceRoot, session.id)

    expect(loaded?.id).toBe(session.id)
    expect(loaded?.name).toBe('Loaded session')
    expect(loaded?.messages).toHaveLength(0)
  })

  it('rejects invalid session ids', () => {
    expect(() => loadLocalSession(workspaceRoot, '../oops')).toThrow()
  })
})
