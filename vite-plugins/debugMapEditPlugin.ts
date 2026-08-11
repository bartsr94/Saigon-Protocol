// Dev-only Vite middleware backing the live map editor
// (docs/LIVE_MAP_EDITOR_SPEC.md, src/components/screens/MapEditorPanel.tsx).
// Sibling to debugTextEditPlugin.ts, but replaces a whole hub/street record
// instead of a single field — see mapRecordSerializer.ts for the actual
// serialize/replace logic this wraps. `apply: 'serve'` keeps this out of
// `vite build`/`vite preview` entirely, same as the text-edit plugin.

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { replaceRecordById } from './mapRecordSerializer.ts'

const EDITABLE_FILES = {
  locationHubs: 'src/content/locationHubs.ts',
  districtStreets: 'src/content/districtStreets.ts',
} as const

type EditableFile = keyof typeof EDITABLE_FILES

function isEditableFile(value: unknown): value is EditableFile {
  return typeof value === 'string' && Object.hasOwn(EDITABLE_FILES, value)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function debugMapEditPlugin(): Plugin {
  return {
    name: 'saigon-protocol-debug-map-edit',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__debug/save-map-record', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { file, id, record } = JSON.parse(body)

            if (!isEditableFile(file) || typeof id !== 'string' || !id || !isPlainRecord(record)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid request.' }))
              return
            }
            if (record.id !== id) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: `Record's own id ('${String(record.id)}') doesn't match the target id ('${id}').` }))
              return
            }

            const absolutePath = path.resolve(process.cwd(), EDITABLE_FILES[file])
            const source = readFileSync(absolutePath, 'utf-8')
            const updated = replaceRecordById(source, id, record)
            writeFileSync(absolutePath, updated, 'utf-8')

            res.statusCode = 200
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.statusCode = err instanceof Error && /^(replaceRecordById|findMatchingBraceEnd):/.test(err.message) ? 409 : 500
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error.' }))
          }
        })
      })
    },
  }
}
