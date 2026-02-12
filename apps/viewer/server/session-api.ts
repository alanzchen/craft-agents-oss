import { listSessions, loadSession, validateSessionId } from '@craft-agent/shared/sessions'
import type { SessionMetadata, StoredSession } from '@craft-agent/shared/sessions'

export interface LocalSessionSummary {
  id: string
  name?: string
  preview?: string
  lastUsedAt: number
  lastMessageAt?: number
  messageCount: number
  isArchived?: boolean
}

export function listLocalSessions(workspaceRootPath: string): LocalSessionSummary[] {
  const sessions = listSessions(workspaceRootPath)
  return sessions
    .filter(session => !session.hidden)
    .map(toLocalSessionSummary)
}

export function loadLocalSession(workspaceRootPath: string, sessionId: string): StoredSession | null {
  validateSessionId(sessionId)
  return loadSession(workspaceRootPath, sessionId)
}

function toLocalSessionSummary(session: SessionMetadata): LocalSessionSummary {
  return {
    id: session.id,
    name: session.name,
    preview: session.preview,
    lastUsedAt: session.lastUsedAt,
    lastMessageAt: session.lastMessageAt,
    messageCount: session.messageCount ?? 0,
    isArchived: session.isArchived,
  }
}
