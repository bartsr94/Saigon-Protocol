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
import { parseTopicsKnot, replaceTopicsInKnot, type TopicBlock } from './inkTopicSerializer.ts'

const INK_DIR = 'content/ink'

function listStoryLocationIds(): Set<string> {
  const absoluteDir = path.resolve(process.cwd(), INK_DIR)
  return new Set(readdirSync(absoluteDir).filter((f) => f.endsWith('.ink')).map((f) => f.slice(0, -'.ink'.length)))
}

function inkPathFor(storyLocationId: string): string {
  return path.resolve(process.cwd(), INK_DIR, `${storyLocationId}.ink`)
}

function jsonPathFor(storyLocationId: string): string {
  return path.resolve(process.cwd(), INK_DIR, `${storyLocationId}.json`)
}

function compileInkSource(source: string): { json?: string; errors: string[] } {
  const errors: string[] = []
  const options = new CompilerOptions(null, [], false, (message: string) => errors.push(message), null)
  try {
    const compiler = new Compiler(source, options)
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

          const source = readFileSync(inkPathFor(storyLocationId), 'utf-8')
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

            const source = readFileSync(inkPathFor(storyLocationId), 'utf-8')
            const updatedSource = replaceTopicsInKnot(source, knotName, topics as TopicBlock[])

            const { json, errors } = compileInkSource(updatedSource)
            if (!json) {
              res.statusCode = 422
              res.end(JSON.stringify({ error: 'Ink compile failed — nothing was written.', details: errors }))
              return
            }

            writeFileSync(inkPathFor(storyLocationId), updatedSource, 'utf-8')
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
