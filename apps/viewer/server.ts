import { existsSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { ensureConfigDir, getActiveWorkspace, getWorkspaceByNameOrId, loadStoredConfig } from '@craft-agent/shared/config'
import type { Workspace } from '@craft-agent/shared/config'
import { setBundledAssetsRoot } from '@craft-agent/shared/utils/paths'
import { listLocalSessions, loadLocalSession } from './server/session-api'

const VIEWER_ROOT = import.meta.dir
const DIST_DIR = join(VIEWER_ROOT, 'dist')
const API_PREFIX = '/s/api'

setBundledAssetsRoot(resolve(VIEWER_ROOT, '../electron'))
ensureConfigDir()

const port = Number(process.env.PORT ?? process.env.CRAFT_WEB_PORT ?? 4174)
const hostname = process.env.CRAFT_WEB_HOST ?? '0.0.0.0'

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  })
}

function resolveWorkspace(searchParams: URLSearchParams): { workspace?: Workspace; error?: string } {
  const config = loadStoredConfig()
  if (!config) {
    return { error: 'No workspace config found. Launch the desktop app once to initialize.' }
  }

  const workspaceParam = searchParams.get('workspace')
  const workspace = workspaceParam ? getWorkspaceByNameOrId(workspaceParam) : getActiveWorkspace()
  if (!workspace) {
    return { error: 'Workspace not found.' }
  }

  return { workspace }
}

async function handleApi(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname === `${API_PREFIX}/health`) {
    return jsonResponse({ ok: true })
  }

  if (pathname === `${API_PREFIX}/sessions`) {
    const { workspace, error } = resolveWorkspace(url.searchParams)
    if (!workspace) {
      return jsonResponse({ error, sessions: [] }, 503)
    }

    return jsonResponse({
      workspace: { id: workspace.id, name: workspace.name },
      sessions: listLocalSessions(workspace.rootPath),
    })
  }

  if (pathname.startsWith(`${API_PREFIX}/`)) {
    const sessionId = pathname.slice(`${API_PREFIX}/`.length)
    if (!sessionId) {
      return jsonResponse({ error: 'Session id required' }, 400)
    }

    const { workspace, error } = resolveWorkspace(url.searchParams)
    if (!workspace) {
      return jsonResponse({ error }, 503)
    }

    try {
      const session = loadLocalSession(workspace.rootPath, sessionId)
      if (!session) {
        return jsonResponse({ error: 'Session not found' }, 404)
      }
      return jsonResponse(session)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid session id'
      return jsonResponse({ error: message }, 400)
    }
  }

  return jsonResponse({ error: 'Not found' }, 404)
}

function serveViewerAsset(pathname: string): Response {
  const relativePath = pathname.replace(/^\/s\//, '') || 'index.html'
  const assetPath = resolve(DIST_DIR, relativePath)

  if (!assetPath.startsWith(DIST_DIR)) {
    return new Response('Not found', { status: 404 })
  }

  if (existsSync(assetPath) && !statSync(assetPath).isDirectory()) {
    const file = Bun.file(assetPath)
    return new Response(file, {
      headers: {
        'content-type': file.type || 'application/octet-stream',
      },
    })
  }

  const indexPath = join(DIST_DIR, 'index.html')
  if (!existsSync(indexPath)) {
    return new Response('Viewer build not found. Run `bun run viewer:build` first.', { status: 500 })
  }

  const indexFile = Bun.file(indexPath)
  return new Response(indexFile, {
    headers: {
      'content-type': indexFile.type || 'text/html; charset=utf-8',
    },
  })
}

Bun.serve({
  port,
  hostname,
  fetch: async (request) => {
    const url = new URL(request.url)

    if (url.pathname === '/') {
      return Response.redirect(new URL('/s/', url), 302)
    }

    if (url.pathname === '/s') {
      return Response.redirect(new URL('/s/', url), 302)
    }

    if (url.pathname.startsWith(API_PREFIX)) {
      return handleApi(request)
    }

    if (url.pathname.startsWith('/s/')) {
      return serveViewerAsset(url.pathname)
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Craft Agent web viewer running at http://${hostname}:${port}/s/`)
