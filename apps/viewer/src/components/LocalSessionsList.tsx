import type { LocalSessionSummary } from '../types/local-sessions'

interface LocalSessionsListProps {
  sessions: LocalSessionSummary[]
  workspaceName?: string
  isLoading: boolean
  error?: string | null
  onSelect: (sessionId: string) => void
}

function formatTimestamp(timestamp?: number) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString()
}

export function LocalSessionsList({
  sessions,
  workspaceName,
  isLoading,
  error,
  onSelect,
}: LocalSessionsListProps) {
  return (
    <div className="w-full max-w-xl mt-10">
      <div className="flex items-center justify-between text-sm font-semibold text-foreground/80">
        <span>Local sessions</span>
        {workspaceName && (
          <span className="text-xs font-normal text-foreground/40">{workspaceName}</span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {isLoading && (
          <div className="text-sm text-foreground/50">Loading sessions...</div>
        )}

        {!isLoading && error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {!isLoading && !error && sessions.length === 0 && (
          <div className="text-sm text-foreground/50">
            No local sessions found yet.
          </div>
        )}

        {!isLoading && !error && sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className="w-full text-left rounded-lg border border-foreground/10 bg-background/70 px-4 py-3 transition hover:border-foreground/20 hover:bg-foreground/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {session.name || session.id}
                </div>
                {session.preview && (
                  <div className="mt-1 text-xs text-foreground/60">
                    {session.preview}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-[11px] text-foreground/40">
                {formatTimestamp(session.lastUsedAt)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
