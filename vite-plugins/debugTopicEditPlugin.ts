// Dev-only Vite middleware backing the live topic editor
// (docs/LIVE_TOPIC_EDITOR_SPEC.md, src/components/screens/TopicEditorPanel.tsx).
// Sibling to debugTextEditPlugin.ts/debugMapEditPlugin.ts, but targets a
// topicsKnot loop inside a `.ink` file instead of a TS content record — see
// inkTopicSerializer.ts for the actual parse/replace logic this wraps.
//
// Unlike the other two live editors, a `.ink` edit needs recompiling to its
// sibling `.json` before it takes effect (`docs/GAME_GUIDE.md` §5.1's
// otherwise-manual `npm run compile:ink` step) — this plugin runs
// inkjs/full's Compiler in-process on save, the same call
// scripts/compile-ink.mjs makes, and refuses to write anything if the
// result doesn't compile.
//
// `apply: 'serve'` keeps this out of `vite build`/`vite preview` entirely,
// same as the other dev-only plugins.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { IncomingMessage } from 'node:http'
import type { Plugin } from 'vite'
import { Compiler, CompilerOptions } from 'inkjs/full'
import { PosixFileHandler } from 'inkjs/compiler/FileHandler/PosixFileHandler'
import { ErrorType } from 'inkjs/compiler/Parser/ErrorType'
import { parseTopicsKnot, replaceTopicsInKnot, type TopicBlock } from './inkTopicSerializer.ts'

const INK_DIR = 'content/ink'
const KNOT_HEADER_RE = /^===\s*(\S+)\s*===$/
const INCLUDE_RE = /^INCLUDE\s+(\S.*\S)\s*$/

function inkDirAbsolute(): string {
  return path.resolve(process.cwd(), INK_DIR)
}

function listStoryLocationIds(): Set<string> {
  return new Set(readdirSync(inkDirAbsolute()).filter((f) => f.endsWith('.ink')).map((f) => f.slice(0, -'.ink'.length)))
}

function inkPathFor(storyLocationId: string): string {
  return path.resolve(inkDirAbsolute(), `${storyLocationId}.ink`)
}

function jsonPathFor(storyLocationId: string): string {
  return path.resolve(inkDirAbsolute(), `${storyLocationId}.json`)
}

function sourceHasKnot(source: string, knotName: string): boolean {
  return source.replace(/\r\n/g, '\n').split('\n').some((line) => {
    const match = KNOT_HEADER_RE.exec(line.trim())
    return match !== null && match[1] === knotName
  })
}

/**
 * A story's entry `.ink` file can INCLUDE per-character files under a
 * subfolder (content/ink/aveline/, docs/SAIGON_PROTOCOL_ARCHITECTURE.md
 * §7) rather than authoring every knot itself — so the file holding a
 * given `topicsKnot` isn't necessarily `${storyLocationId}.ink`. Walks the
 * INCLUDE graph breadth-first from the entry file and returns the first
 * file (entry first, then includes in declaration order) whose source
 * contains that knot's header, mirroring parseTopicsKnot's own
 * fail-if-missing posture.
 */
function findKnotFile(storyLocationId: string, knotName: string): string {
  const seen = new Set<string>()
  const queue = [inkPathFor(storyLocationId)]
  while (queue.length > 0) {
    const filePath = queue.shift()!
    if (seen.has(filePath)) continue
    seen.add(filePath)
    const source = readFileSync(filePath, 'utf-8')
    if (sourceHasKnot(source, knotName)) return filePath
    for (const line of source.replace(/\r\n/g, '\n').split('\n')) {
      const match = INCLUDE_RE.exec(line.trim())
      if (match) queue.push(path.resolve(path.dirname(filePath), match[1]))
    }
  }
  throw new Error(`parseTopicsKnot: no knot named '${knotName}' found.`)
}

function compileInkSource(entryStoryLocationId: string, pendingPath: string, pendingSource: string): { json?: string; errors: string[] } {
  // Only ErrorType.Error is fatal — inkjs also routes non-fatal Author/Warning
  // messages through this same callback (e.g. a benign "apparent loose end"
  // notice elsewhere in the compiled story), and those must not block an
  // unrelated save.
  const errors: string[] = []
  const entryPath = inkPathFor(entryStoryLocationId)
  const baseHandler = new PosixFileHandler(inkDirAbsolute())
  // Overrides only the one file being edited so the compile-check sees the
  // pending (not-yet-written) content; every other INCLUDE still reads
  // from disk via PosixFileHandler. Keeps the "never write a broken file"
  // guarantee below without writing pendingSource to disk before we know
  // it compiles.
  const fileHandler = {
    ResolveInkFilename: baseHandler.ResolveInkFilename,
    LoadInkFileContents: (filename: string) => (path.resolve(filename) === pendingPath ? pendingSource : baseHandler.LoadInkFileContents(filename)),
  }
  const entrySource = entryPath === pendingPath ? pendingSource : readFileSync(entryPath, 'utf-8')
  const options = new CompilerOptions(entryPath, [], false, (message: string, errorType: ErrorType) => {
    if (errorType === ErrorType.Error) errors.push(message)
  }, fileHandler)
  try {
    const compiler = new Compiler(entrySource, options)
    const story = compiler.Compile()
    if (errors.length > 0) return { errors }
    return { json: story.ToJson(), errors: [] }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err))
    return { errors }
  }
}

function isTopicBlock(value: unknown): value is TopicBlock {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (v.kind === 'complex') return typeof v.raw === 'string'
  if (v.kind === 'simple') {
    return (
      typeof v.choiceText === 'string' &&
      typeof v.responseText === 'string' &&
      (v.insightTag === undefined || typeof v.insightTag === 'string') &&
      (v.speakerNpcId === undefined || typeof v.speakerNpcId === 'string')
    )
  }
  return false
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => resolve(body))
  })
}

function statusForError(err: unknown): number {
  return err instanceof Error && /^parseTopicsKnot:/.test(err.message) ? 409 : 500
}

export function debugTopicEditPlugin(): Plugin {
  return {
    name: 'saigon-protocol-debug-topic-edit',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__debug/topics', (req, res, next) => {
        if (req.method !== 'GET') {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const storyLocationId = url.searchParams.get('storyLocationId') ?? ''
          const knotName = url.searchParams.get('knotName') ?? ''

          if (!storyLocationId || !listStoryLocationIds().has(storyLocationId) || !knotName) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid request.' }))
            return
          }

          const source = readFileSync(findKnotFile(storyLocationId, knotName), 'utf-8')
          const parsed = parseTopicsKnot(source, knotName)
          res.statusCode = 200
          res.end(JSON.stringify({ topics: parsed.topics }))
        } catch (err) {
          res.statusCode = statusForError(err)
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error.' }))
        }
      })

      server.middlewares.use('/__debug/save-topics', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        readRequestBody(req).then((body) => {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { storyLocationId, knotName, topics } = JSON.parse(body)

            if (
              typeof storyLocationId !== 'string' ||
              !listStoryLocationIds().has(storyLocationId) ||
              typeof knotName !== 'string' ||
              !knotName ||
              !Array.isArray(topics) ||
              !topics.every(isTopicBlock)
            ) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid request.' }))
              return
            }

            const knotFilePath = findKnotFile(storyLocationId, knotName)
            const source = readFileSync(knotFilePath, 'utf-8')
            const updatedSource = replaceTopicsInKnot(source, knotName, topics as TopicBlock[])

            const { json, errors } = compileInkSource(storyLocationId, knotFilePath, updatedSource)
            if (!json) {
              res.statusCode = 422
              res.end(JSON.stringify({ error: 'Ink compile failed — nothing was written.', details: errors }))
              return
            }

            writeFileSync(knotFilePath, updatedSource, 'utf-8')
            writeFileSync(jsonPathFor(storyLocationId), json, 'utf-8')

            res.statusCode = 200
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.statusCode = statusForError(err)
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error.' }))
          }
        })
      })
    },
  }
}
