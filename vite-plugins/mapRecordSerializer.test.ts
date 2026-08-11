import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { replaceRecordById, serializeRecord, serializeValue } from './mapRecordSerializer'
import { LOCATION_HUBS } from '../src/content/locationHubs'
import { DISTRICT_STREETS } from '../src/content/districtStreets'

const here = path.dirname(fileURLToPath(import.meta.url))

describe('serializeValue', () => {
  it('single-quotes strings and swaps straight apostrophes for typographic ones', () => {
    expect(serializeValue('plain text', 0)).toBe("'plain text'")
    expect(serializeValue("don't", 0)).toBe("'don’t'")
  })

  it('flattens newlines, since every editable field is single-line prose', () => {
    expect(serializeValue('line one\nline two', 0)).toBe("'line one line two'")
  })

  it('prints numbers and booleans bare', () => {
    expect(serializeValue(3, 0)).toBe('3')
    expect(serializeValue(true, 0)).toBe('true')
    expect(serializeValue(false, 0)).toBe('false')
  })

  it('keeps an {x, y} position object inline', () => {
    expect(serializeValue({ x: 2, y: 5 }, 3)).toBe('{ x: 2, y: 5 }')
  })

  it('expands a non-position object one key per line, indented, unquoted identifier keys, trailing commas', () => {
    expect(serializeValue({ id: 'poi-1', available: true }, 0)).toBe(["{", "  id: 'poi-1',", '  available: true,', '}'].join('\n'))
  })

  it('omits keys whose value is undefined instead of writing null', () => {
    expect(serializeValue({ label: 'x', lockedReason: undefined }, 0)).toBe(["{", "  label: 'x',", '}'].join('\n'))
  })

  it('renders an empty array inline', () => {
    expect(serializeValue({ actions: [] }, 0)).toBe(['{', '  actions: [],', '}'].join('\n'))
  })

  it('expands a non-empty array one element per line', () => {
    expect(serializeValue(['a', 'b'], 0)).toBe(["[", "  'a',", "  'b',", ']'].join('\n'))
  })

  it('quotes a key that is not a valid bare identifier', () => {
    expect(serializeValue({ 'weird key': 1 }, 0)).toBe(["{", "  'weird key': 1,", '}'].join('\n'))
  })
})

describe('serializeRecord', () => {
  it('produces id: { ... } at the given indent level', () => {
    expect(serializeRecord('checkpoint', { id: 'checkpoint', available: true }, 1)).toBe(
      ["checkpoint: {", "    id: 'checkpoint',", '    available: true,', '  }'].join('\n'),
    )
  })
})

describe('replaceRecordById', () => {
  const source = [
    'export const THINGS = {',
    '  alpha: {',
    "    id: 'alpha',",
    '    count: 1,',
    '  },',
    '  beta: {',
    "    id: 'beta',",
    '    count: 2,',
    '  },',
    '}',
    '',
  ].join('\n')

  it('replaces exactly the targeted record, leaving everything else byte-identical', () => {
    const result = replaceRecordById(source, 'alpha', { id: 'alpha', count: 99, note: 'new' })
    expect(result).toBe(
      [
        'export const THINGS = {',
        "  alpha: {",
        "    id: 'alpha',",
        '    count: 99,',
        "    note: 'new',",
        '  },',
        '  beta: {',
        "    id: 'beta',",
        '    count: 2,',
        '  },',
        '}',
        '',
      ].join('\n'),
    )
  })

  it('is idempotent: replacing a record with an equivalent plain object round-trips to the same text (no embedded comments)', () => {
    const result = replaceRecordById(source, 'beta', { id: 'beta', count: 2 })
    expect(result).toBe(source)
  })

  it('throws rather than inserting when the id does not exist', () => {
    expect(() => replaceRecordById(source, 'gamma', { id: 'gamma' })).toThrow(/no existing record/)
  })

  it('throws on an ambiguous id (found more than once)', () => {
    const dupeSource = source.replace("id: 'beta',", "id: 'alpha',").replace('beta: {', 'alpha: {')
    expect(() => replaceRecordById(dupeSource, 'alpha', { id: 'alpha' })).toThrow(/refusing an ambiguous write/)
  })

  it('throws on unbalanced braces instead of silently truncating the file', () => {
    const cursor = source.indexOf('beta: {') + 'beta: {'.length
    const broken = source.slice(0, cursor)
    expect(() => replaceRecordById(broken, 'beta', { id: 'beta', count: 2 })).toThrow(/unbalanced braces/)
  })

  it('is not confused by a quote character inside a // comment', () => {
    const withComment = source.replace('beta: {', '// a "quoted" aside\n  beta: {')
    const result = replaceRecordById(withComment, 'beta', { id: 'beta', count: 3 })
    expect(result).toContain('count: 3,')
    expect(result).toContain('a "quoted" aside')
  })
})

describe('replaceRecordById against real content files', () => {
  // Every grid-shaped record currently in the repo carries a hand-written
  // explanatory comment inside it (checkpoint's loop-around-a-void note,
  // district4/district1's non-rectangular-street notes) — this is
  // data-only serialization, so those comments are expected to be dropped
  // on a live-edit save. Documented in docs/LIVE_MAP_EDITOR_SPEC.md; these
  // assertions pin that known, accepted behavior rather than let it regress
  // silently into something worse (e.g. corrupting the file).
  it('replaces the checkpoint hub, preserving the rest of locationHubs.ts and dropping its internal comment', () => {
    const filePath = path.resolve(here, '../src/content/locationHubs.ts')
    const source = readFileSync(filePath, 'utf-8')
    const result = replaceRecordById(source, 'checkpoint', LOCATION_HUBS.checkpoint)

    expect(result).not.toBe(source)
    expect(result).not.toContain('A loop around a blank core')
    expect(result).toContain("id: 'checkpoint-mei-hong'")
    expect(result.slice(0, source.indexOf('checkpoint: {'))).toBe(source.slice(0, source.indexOf('checkpoint: {')))
    expect(result).toContain("\r\n  noodleStall: {\r\n    id: 'noodleStall',")
  })

  it('matches the source file\'s CRLF line endings rather than mixing them in', () => {
    const filePath = path.resolve(here, '../src/content/locationHubs.ts')
    const source = readFileSync(filePath, 'utf-8')
    const result = replaceRecordById(source, 'checkpoint', LOCATION_HUBS.checkpoint)
    const checkpointSpan = result.slice(result.indexOf('checkpoint: {'), result.indexOf('noodleStall: {'))
    expect(/(?<!\r)\n/.test(checkpointSpan)).toBe(false)
    expect(checkpointSpan.split('\r\n').length).toBeGreaterThan(5)
  })

  it('replaces the district1 street, preserving the rest of districtStreets.ts and dropping its internal comment', () => {
    const filePath = path.resolve(here, '../src/content/districtStreets.ts')
    const source = readFileSync(filePath, 'utf-8')
    const result = replaceRecordById(source, 'district1', DISTRICT_STREETS.district1!)

    expect(result).not.toBe(source)
    expect(result).not.toContain('plainer than District 4')
    expect(result).toContain("id: 'district1-sezac-records'")
    expect(result.slice(0, source.indexOf('district1: {'))).toBe(source.slice(0, source.indexOf('district1: {')))
  })
})
