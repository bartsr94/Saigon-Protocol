// Turns a plain JS value into this codebase's TS object-literal source style
// (src/content/locationHubs.ts, src/content/districtStreets.ts): unquoted
// identifier keys, single-quoted strings, `undefined` fields omitted rather
// than written as `null`, small {x, y} position objects kept inline, every
// other non-empty object/array expanded one entry per line. Backs
// debugMapEditPlugin.ts's whole-record replace for the live map editor.
//
// This is data-only serialization: it has no way to know about (and will
// therefore drop) hand-written comments inside the record it replaces —
// documented and accepted in docs/LIVE_MAP_EDITOR_SPEC.md rather than solved
// with a full comment-preserving AST tool.

const IDENTIFIER_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/

// Matches this codebase's own convention (also used by
// debugTextEditPlugin.ts): typographic apostrophes mean a single-quoted
// string literal never needs escaping. Newlines are flattened since every
// field this touches is single-line prose.
function sanitizeForSingleQuotedLiteral(value: string): string {
  return value.replace(/\r?\n/g, ' ').replace(/'/g, '’')
}

function serializeKey(key: string): string {
  return IDENTIFIER_KEY.test(key) ? key : `'${sanitizeForSingleQuotedLiteral(key)}'`
}

function isPositionLike(value: object): value is { x: number; y: number } {
  const keys = Object.keys(value)
  if (keys.length !== 2 || !keys.includes('x') || !keys.includes('y')) return false
  const v = value as Record<string, unknown>
  return typeof v.x === 'number' && typeof v.y === 'number'
}

export function serializeValue(value: unknown, indent: number): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return `'${sanitizeForSingleQuotedLiteral(value)}'`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const pad = '  '.repeat(indent + 1)
    const closePad = '  '.repeat(indent)
    const items = value.map((item) => `${pad}${serializeValue(item, indent + 1)},`)
    return `[\n${items.join('\n')}\n${closePad}]`
  }

  if (typeof value === 'object') {
    if (isPositionLike(value)) {
      const v = value as { x: number; y: number }
      return `{ x: ${v.x}, y: ${v.y} }`
    }
    const entries = Object.entries(value).filter(([, v]) => v !== undefined)
    if (entries.length === 0) return '{}'
    const pad = '  '.repeat(indent + 1)
    const closePad = '  '.repeat(indent)
    const lines = entries.map(([k, v]) => `${pad}${serializeKey(k)}: ${serializeValue(v, indent + 1)},`)
    return `{\n${lines.join('\n')}\n${closePad}}`
  }

  throw new Error(`serializeValue: unsupported value type '${typeof value}'`)
}

/** `id: { ... }`, at the given indent level (2 spaces per level) — the shape of one entry inside a `Record<Id, Definition>` content module. */
export function serializeRecord(id: string, record: object, indent: number): string {
  return `${serializeKey(id)}: ${serializeValue(record, indent)}`
}

// String- and comment-aware brace counter. Both are needed: this codebase's
// hand-written `//` comments routinely quote things ("like this"), and
// without comment-awareness a stray quote character inside a comment would
// be misread as opening a string literal, desyncing the whole scan.
// Backslash inside a string skips the next character, same as a real JS/TS
// string literal.
function findMatchingBraceEnd(source: string, openBraceIndex: number): number {
  let depth = 0
  let inString = false
  let quoteChar = ''
  let inLineComment = false
  let inBlockComment = false

  for (let i = openBraceIndex; i < source.length; i++) {
    const ch = source[i]
    const next = source[i + 1]

    if (inLineComment) {
      if (ch === '\n') inLineComment = false
      continue
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        i++
      }
      continue
    }
    if (inString) {
      if (ch === '\\') {
        i++
        continue
      }
      if (ch === quoteChar) inString = false
      continue
    }
    if (ch === '/' && next === '/') {
      inLineComment = true
      i++
      continue
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true
      i++
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true
      quoteChar = ch
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  throw new Error('findMatchingBraceEnd: reached end of file with unbalanced braces')
}

/**
 * Replaces an existing `id: { ... }` entry in `source` with a freshly
 * serialized version of `record`. Refuses (throws) rather than guessing when
 * `id` isn't found or is ambiguous — new-record creation isn't supported
 * here (docs/LIVE_MAP_EDITOR_SPEC.md's explicit scope boundary), so a
 * missing id is always an error, never an insert.
 */
export function replaceRecordById(source: string, id: string, record: object, indent = 1): string {
  const needle = `${serializeKey(id)}: {`
  const matches: number[] = []
  let searchFrom = 0
  for (;;) {
    const idx = source.indexOf(needle, searchFrom)
    if (idx === -1) break
    matches.push(idx)
    searchFrom = idx + needle.length
  }

  if (matches.length === 0) {
    throw new Error(`replaceRecordById: no existing record with id '${id}' — creating new records isn't supported here.`)
  }
  if (matches.length > 1) {
    throw new Error(`replaceRecordById: found ${matches.length} records matching id '${id}' — refusing an ambiguous write.`)
  }

  const matchStart = matches[0]
  const openBraceIndex = matchStart + needle.length - 1
  const closeBraceIndex = findMatchingBraceEnd(source, openBraceIndex)

  // Match the file's own line endings — this repo's content modules are
  // CRLF (Windows checkout), and splicing in LF-only text would leave the
  // file with mixed line endings outside the edited span.
  const usesCrlf = source.includes('\r\n')
  const replacement = serializeRecord(id, record, indent)
  const normalizedReplacement = usesCrlf ? replacement.replace(/\n/g, '\r\n') : replacement

  return source.slice(0, matchStart) + normalizedReplacement + source.slice(closeBraceIndex + 1)
}
