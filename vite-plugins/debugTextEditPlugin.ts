// Dev-only Vite middleware backing the in-game text editor (App.tsx's text-edit
// toggle, src/components/debug/EditableText.tsx). Lets a blurb/description
// edited on a live screen get written straight back to its content-module
// source file, instead of the copy/paste-JSON workflow MapBuilderTool uses.
// `apply: 'serve'` keeps this out of `vite build`/`vite preview` entirely —
// it only exists while `npm run dev`'s Node process is running.

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const EDITABLE_FILES = {
  locations: 'src/content/locations.ts',
  locationHubs: 'src/content/locationHubs.ts',
  districtStreets: 'src/content/districtStreets.ts',
} as const

type EditableFile = keyof typeof EDITABLE_FILES

const EDITABLE_FIELDS = new Set(['blurb', 'description', 'lockedReason'])

function isEditableFile(value: unknown): value is EditableFile {
  return typeof value === 'string' && Object.hasOwn(EDITABLE_FILES, value)
}

// This codebase's content modules use typographic apostrophes (') precisely
// so their single-quoted string literals never need escaping — straight
// apostrophes are swapped to match instead of producing a broken literal.
// Newlines are flattened since every editable field is single-line prose.
function sanitizeForSingleQuotedLiteral(value: string): string {
  return value.replace(/\r?\n/g, ' ').replace(/'/g, '’')
}

export function debugTextEditPlugin(): Plugin {
  return {
    name: 'saigon-protocol-debug-text-edit',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__debug/save-text', (req, res, next) => {
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
            const { file, field, oldValue, newValue } = JSON.parse(body)

            if (!isEditableFile(file) || typeof field !== 'string' || !EDITABLE_FIELDS.has(field) || typeof oldValue !== 'string' || typeof newValue !== 'string') {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid request.' }))
              return
            }

            const absolutePath = path.resolve(process.cwd(), EDITABLE_FILES[file])
            const source = readFileSync(absolutePath, 'utf-8')
            const oldToken = `${field}: '${oldValue}'`
            const occurrences = source.split(oldToken).length - 1

            if (occurrences !== 1) {
              res.statusCode = 409
              res.end(
                JSON.stringify({
                  error: `Expected exactly one match for this text in ${EDITABLE_FILES[file]}, found ${occurrences}. Edit the file by hand instead.`,
                }),
              )
              return
            }

            const newToken = `${field}: '${sanitizeForSingleQuotedLiteral(newValue)}'`
            writeFileSync(absolutePath, source.replace(oldToken, newToken), 'utf-8')

            res.statusCode = 200
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error.' }))
          }
        })
      })
    },
  }
}
