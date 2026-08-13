import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseTopicsKnot, replaceTopicsInKnot, serializeTopicsKnot, type SimpleTopic } from './inkTopicSerializer'

const here = path.dirname(fileURLToPath(import.meta.url))
const checkpointInk = readFileSync(path.join(here, '../content/ink/checkpoint.ink'), 'utf-8')

describe('parseTopicsKnot', () => {
  it('classifies a plain choice+response+self-divert topic as simple', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'mei_hong_topics')
    const first = parsed.topics[0] as SimpleTopic
    expect(first.kind).toBe('simple')
    expect(first.choiceText).toBe('Ask about her role here.')
    expect(first.insightTag).toBe('ledger')
    expect(first.responseText).toContain('Operations.')
    expect(first.speakerNpcId).toBeUndefined()
  })

  it('captures a trailing speaker tag on the response', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'mei_hong_topics')
    const last = parsed.topics[parsed.topics.length - 1] as SimpleTopic
    expect(last.kind).toBe('simple')
    expect(last.speakerNpcId).toBe('meiHong')
    expect(last.responseText.endsWith('# speaker:')).toBe(false)
  })

  it('classifies a roll_check topic as complex and preserves it verbatim', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'mei_hong_topics')
    const checkTopic = parsed.topics.find((t) => t.kind === 'complex' && t.raw.includes('roll_check'))
    expect(checkTopic).toBeDefined()
    expect(checkTopic!.kind).toBe('complex')
  })

  it('classifies a precondition-gated choice ("* { ... } [...]") as complex', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'mei_hong_topics')
    const gated = parsed.topics.find((t) => t.kind === 'complex' && t.raw.includes('is_red_check_consumed'))
    expect(gated).toBeDefined()
  })

  it('captures the knot preamble and trailer', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'mei_hong_topics')
    expect(parsed.preambleLines.join('\n')).toContain('Mei Hong gives you her attention again')
    expect(parsed.trailerLines.join('\n')).toContain('Aveline Faculty Lounge sub-location')
  })

  it('parses the second real topics knot (lakshmi_avani_topics) the same way', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'lakshmi_avani_topics')
    expect(parsed.topics.length).toBe(3)
    const first = parsed.topics[0] as SimpleTopic
    expect(first.kind).toBe('simple')
    expect(first.choiceText).toBe('Ask what she actually works on.')
    expect(first.insightTag).toBe('graft')
  })

  it('throws on an unknown knot name', () => {
    expect(() => parseTopicsKnot(checkpointInk, 'does_not_exist')).toThrow(/no knot named/)
  })
})

describe('serializeTopicsKnot / replaceTopicsInKnot round-trip', () => {
  it('reproduces the exact original knot body for mei_hong_topics with zero edits', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'mei_hong_topics')
    const rebuilt = serializeTopicsKnot('mei_hong_topics', parsed, parsed.topics)

    const lines = checkpointInk.replace(/\r\n/g, '\n').split('\n')
    const headerIndex = lines.findIndex((l) => l.trim() === '=== mei_hong_topics ===')
    const nextHeaderIndex = lines.findIndex((l, i) => i > headerIndex && /^===.*===$/.test(l.trim()))
    const originalBody = lines.slice(headerIndex + 1, nextHeaderIndex).join('\n')

    expect(rebuilt).toBe(originalBody)
  })

  it('reproduces the exact original knot body for lakshmi_avani_topics with zero edits', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'lakshmi_avani_topics')
    const rebuilt = serializeTopicsKnot('lakshmi_avani_topics', parsed, parsed.topics)

    const lines = checkpointInk.replace(/\r\n/g, '\n').split('\n')
    const headerIndex = lines.findIndex((l) => l.trim() === '=== lakshmi_avani_topics ===')
    const nextHeaderIndex = lines.findIndex((l, i) => i > headerIndex && /^===.*===$/.test(l.trim()))
    const originalBody = lines.slice(headerIndex + 1, nextHeaderIndex).join('\n')

    expect(rebuilt).toBe(originalBody)
  })

  it('replaceTopicsInKnot leaves the rest of the file untouched and keeps CRLF', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'lakshmi_avani_topics')
    const updated = replaceTopicsInKnot(checkpointInk, 'lakshmi_avani_topics', parsed.topics)
    expect(updated).toBe(checkpointInk)
    expect(updated.includes('\r\n')).toBe(true)
  })

  it('edits a simple topic in place', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'lakshmi_avani_topics')
    const edited = parsed.topics.map((t, i) =>
      i === 0 && t.kind === 'simple' ? { ...t, choiceText: 'Ask about her lab equipment.', responseText: 'New response text.' } : t,
    )
    const updated = replaceTopicsInKnot(checkpointInk, 'lakshmi_avani_topics', edited)
    expect(updated).toContain('* [Ask about her lab equipment. # insight: graft]')
    expect(updated).toContain('    New response text.')
    expect(updated).not.toContain('Adaptive physiology')
  })

  it('adds a new simple topic at the end of the list', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'lakshmi_avani_topics')
    const withNewTopic: SimpleTopic = {
      kind: 'simple',
      choiceText: 'Ask if she has family back home.',
      insightTag: 'root',
      responseText: "\"Not the kind you'd call.\" She goes quiet for a second.",
      speakerNpcId: 'lakshmiAvani',
    }
    const updated = replaceTopicsInKnot(checkpointInk, 'lakshmi_avani_topics', [...parsed.topics, withNewTopic])
    expect(updated).toContain('* [Ask if she has family back home. # insight: root]')
    expect(updated).toContain("    \"Not the kind you'd call.\" She goes quiet for a second. # speaker: npc:lakshmiAvani")
    expect(updated).toContain('    -> lakshmi_avani_topics')
    // The rest of the file (e.g. the roster-wall knot after it) is preserved.
    expect(updated).toContain('=== checkpoint_lounge_roster_wall ===')
  })

  it('removes a topic', () => {
    const parsed = parseTopicsKnot(checkpointInk, 'lakshmi_avani_topics')
    const withoutFirst = parsed.topics.slice(1)
    const updated = replaceTopicsInKnot(checkpointInk, 'lakshmi_avani_topics', withoutFirst)
    expect(updated).not.toContain('Adaptive physiology')
    expect(updated).toContain('Ask if anything about the case has surprised her')
  })
})
