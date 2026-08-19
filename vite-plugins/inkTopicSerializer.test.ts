import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseTopicsKnot, replaceTopicsInKnot, serializeTopicsKnot, type SimpleTopic } from './inkTopicSerializer'

const here = path.dirname(fileURLToPath(import.meta.url))
const checkpointInk = readFileSync(path.join(here, '../content/ink/district4/checkpoint.ink'), 'utf-8')
const meiHongInk = readFileSync(path.join(here, '../content/ink/district4/aveline/meiHong.ink'), 'utf-8')
const lakshmiAvaniInk = readFileSync(path.join(here, '../content/ink/district4/aveline/lakshmiAvani.ink'), 'utf-8')

describe('parseTopicsKnot', () => {
  it('classifies a plain choice+response+self-divert topic as simple', () => {
    const parsed = parseTopicsKnot(meiHongInk, 'mei_hong_topics')
    const first = parsed.topics[0] as SimpleTopic
    expect(first.kind).toBe('simple')
    expect(first.choiceText).toBe('Ask about her role here.')
    expect(first.insightTag).toBe('ledger')
    expect(first.responseText).toContain('Operations.')
    expect(first.speakerNpcId).toBeUndefined()
  })

  it('captures a trailing speaker tag on the response', () => {
    const parsed = parseTopicsKnot(meiHongInk, 'mei_hong_topics')
    const tagged = parsed.topics.find((t): t is SimpleTopic => t.kind === 'simple' && t.speakerNpcId === 'meiHong')
    expect(tagged).toBeDefined()
    expect(tagged!.responseText.endsWith('# speaker:')).toBe(false)
  })

  it('classifies a roll_check topic as complex and preserves it verbatim', () => {
    const parsed = parseTopicsKnot(meiHongInk, 'mei_hong_topics')
    const checkTopic = parsed.topics.find((t) => t.kind === 'complex' && t.raw.includes('roll_check'))
    expect(checkTopic).toBeDefined()
    expect(checkTopic!.kind).toBe('complex')
  })

  it('classifies a precondition-gated choice ("* { ... } [...]") as complex', () => {
    const parsed = parseTopicsKnot(meiHongInk, 'mei_hong_topics')
    const gated = parsed.topics.find((t) => t.kind === 'complex' && t.raw.includes('is_red_check_consumed'))
    expect(gated).toBeDefined()
  })

  it('captures the knot preamble and trailer', () => {
    const parsed = parseTopicsKnot(meiHongInk, 'mei_hong_topics')
    expect(parsed.preambleLines.join('\n')).toContain('Mei Hong gives you her attention again')
    expect(parsed.trailerLines.join('\n')).toContain("End of Mei Hong's content")
  })

  it('parses the second real topics knot (lakshmi_avani_topics) the same way', () => {
    const parsed = parseTopicsKnot(lakshmiAvaniInk, 'lakshmi_avani_topics')
    expect(parsed.topics.length).toBe(10)
    expect(parsed.topics[0]!.kind).toBe('complex')
    const simple = parsed.topics.find((t): t is SimpleTopic => t.kind === 'simple')
    expect(simple).toBeUndefined()
    const checkTopic = parsed.topics.find((t) => t.kind === 'complex' && t.raw.includes('checkpoint-lakshmi-surprised'))
    expect(checkTopic).toBeDefined()
  })

  it('throws on an unknown knot name', () => {
    expect(() => parseTopicsKnot(checkpointInk, 'does_not_exist')).toThrow(/no knot named/)
  })
})

describe('serializeTopicsKnot / replaceTopicsInKnot round-trip', () => {
  it('reproduces the exact original knot body for mei_hong_topics with zero edits', () => {
    const parsed = parseTopicsKnot(meiHongInk, 'mei_hong_topics')
    const rebuilt = serializeTopicsKnot('mei_hong_topics', parsed, parsed.topics)

    const lines = meiHongInk.replace(/\r\n/g, '\n').split('\n')
    const headerIndex = lines.findIndex((l) => l.trim() === '=== mei_hong_topics ===')
    const nextHeaderIndex = lines.findIndex((l, i) => i > headerIndex && /^===.*===$/.test(l.trim()))
    const originalBody = lines.slice(headerIndex + 1, nextHeaderIndex === -1 ? lines.length : nextHeaderIndex).join('\n')

    expect(rebuilt).toBe(originalBody)
  })

  it('reproduces the exact original knot body for lakshmi_avani_topics with zero edits', () => {
    const parsed = parseTopicsKnot(lakshmiAvaniInk, 'lakshmi_avani_topics')
    const rebuilt = serializeTopicsKnot('lakshmi_avani_topics', parsed, parsed.topics)

    const lines = lakshmiAvaniInk.replace(/\r\n/g, '\n').split('\n')
    const headerIndex = lines.findIndex((l) => l.trim() === '=== lakshmi_avani_topics ===')
    const nextHeaderIndex = lines.findIndex((l, i) => i > headerIndex && /^===.*===$/.test(l.trim()))
    const originalBody = lines.slice(headerIndex + 1, nextHeaderIndex).join('\n')

    expect(rebuilt).toBe(originalBody)
  })

  it('replaceTopicsInKnot leaves the rest of the file untouched and keeps CRLF', () => {
    const parsed = parseTopicsKnot(lakshmiAvaniInk, 'lakshmi_avani_topics')
    const updated = replaceTopicsInKnot(lakshmiAvaniInk, 'lakshmi_avani_topics', parsed.topics)
    expect(updated).toBe(lakshmiAvaniInk)
    expect(updated.includes('\r\n')).toBe(true)
  })

  it('edits a simple topic in place', () => {
    const parsed = parseTopicsKnot(meiHongInk, 'mei_hong_topics')
    const firstSimpleIndex = parsed.topics.findIndex((t) => t.kind === 'simple' && t.choiceText === 'Ask about her role here.')
    const edited = parsed.topics.map((t, i) =>
      i === firstSimpleIndex && t.kind === 'simple'
        ? { ...t, choiceText: 'Ask about her lab equipment.', responseText: 'New response text.' }
        : t,
    )
    const updated = replaceTopicsInKnot(meiHongInk, 'mei_hong_topics', edited)
    expect(updated).toContain('* [Ask about her lab equipment. # insight: ledger]')
    expect(updated).toContain('    New response text.')
    expect(updated).not.toContain('Operations. I keep the lights on and the paperwork honest')
  })

  it('adds a new simple topic at the end of the list', () => {
    const parsed = parseTopicsKnot(meiHongInk, 'mei_hong_topics')
    const withNewTopic: SimpleTopic = {
      kind: 'simple',
      choiceText: 'Ask if she has family back home.',
      insightTag: 'root',
      responseText: "\"Not the kind you'd call.\" She goes quiet for a second.",
      speakerNpcId: 'meiHong',
    }
    const updated = replaceTopicsInKnot(meiHongInk, 'mei_hong_topics', [...parsed.topics, withNewTopic])
    expect(updated).toContain('* [Ask if she has family back home. # insight: root]')
    expect(updated).toContain("    \"Not the kind you'd call.\" She goes quiet for a second. # speaker: npc:meiHong")
    expect(updated).toContain('    -> mei_hong_topics')
    expect(updated).toContain("End of Mei Hong's content")
  })

  it('removes a topic', () => {
    const parsed = parseTopicsKnot(meiHongInk, 'mei_hong_topics')
    const withoutFirst = parsed.topics.slice(1)
    const updated = replaceTopicsInKnot(meiHongInk, 'mei_hong_topics', withoutFirst)
    expect(updated).not.toContain('Ask about her role here.')
    expect(updated).toContain('Ask if she\'s worried about the investigation')
  })
})
