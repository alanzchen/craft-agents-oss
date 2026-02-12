export interface LocalSessionSummary {
  id: string
  name?: string
  preview?: string
  lastUsedAt: number
  lastMessageAt?: number
  messageCount: number
  isArchived?: boolean
}

export interface LocalSessionsResponse {
  workspace?: {
    id: string
    name: string
  }
  sessions: LocalSessionSummary[]
  error?: string
}
