// Parses/serializes the "simple topic" shape inside a topicsKnot loop
// (docs/LIVE_TOPIC_EDITOR_SPEC.md) — one `* [choice text]` or
// `* [choice text] spoken line.` line (GAME_GUIDE.md §5.2's topic-word
// convention: the bracket is the short button label, anything after it is
// the detective's own spoken line, added to the output by ink itself), a
// plain response, and a self-divert back to the knot, the exact shape
// `mei_hong_topics`/`lakshmi_avani_topics` (content/ink/district4/checkpoint.ink)
// use. Anything else inside a topicsKnot (a roll_check call, a
// conditional, a case grant, a precondition-gated choice) is a
// "complex" topic: parsed as an opaque block and re-emitted byte-for-byte,
// never re-derived from a data model — this tool never has to understand
// ink control flow it wasn't built to edit. Backs debugTopicEditPlugin.ts's
// live topic editor.
//
// Pure and Node-free by design (no fs/inkjs imports here), same testable
// style as mapRecordSerializer.ts.

export interface SimpleTopic {
  kind: 'simple'
  choiceText: string
  insightTag?: string
  /** Text after the choice's closing bracket (GAME_GUIDE.md §5.2's topic-word convention) — ink adds it to the output the moment the choice is taken, so it reads as the detective's own spoken line, distinct from `choiceText`'s short button label. Omitted for a bracket-only choice. */
  spokenText?: string
  responseText: string
  speakerNpcId?: string
}

export interface ComplexTopic {
  kind: 'complex'
  raw: string
}

export type TopicBlock = SimpleTopic | ComplexTopic

export interface ParsedTopicsKnot {
  preambleLines: string[]
  topics: TopicBlock[]
  trailerLines: string[]
}

// Group 2 captures any spoken-line text after the closing bracket (empty for
// a bracket-only choice) — see `SimpleTopic.spokenText`.
const CHOICE_LINE = /^\* \[(.*)\](.*)$/
// A choice block can start with `*` (once) or `+` (sticky, docs/GAME_GUIDE.md's
// repeatable-topic convention) — either marks a new topic boundary here, even
// though only a bare `* [...]` line (CHOICE_LINE above) is eligible to be
// classified "simple"; a `+`-led block is always "complex" and preserved raw.
const CHOICE_START = /^[*+]\s/
const SPEAKER_LINE = /^(.*)\s#\sspeaker:\snpc:([A-Za-z0-9_]+)$/
const KNOT_HEADER = /^===.*===$/

function findKnotHeaderIndex(lines: string[], knotName: string): number {
  const needle = `=== ${knotName} ===`
  const matches: number[] = []
  lines.forEach((line, i) => {
    if (line.trim() === needle) matches.push(i)
  })
  if (matches.length === 0) throw new Error(`parseTopicsKnot: no knot named '${knotName}' found.`)
  if (matches.length > 1) throw new Error(`parseTopicsKnot: found ${matches.length} knots named '${knotName}' — refusing an ambiguous edit.`)
  return matches[0]
}

function findKnotBodyEnd(lines: string[], bodyStart: number): number {
  for (let i = bodyStart; i < lines.length; i++) {
    if (KNOT_HEADER.test(lines[i].trim())) return i
  }
  return lines.length
}

/** Classifies one topic block (starting at its `* [...]`/`* {...}` line) as simple or complex. */
function classifyBlock(rawLines: string[], knotName: string): TopicBlock {
  const raw = rawLines.join('\n')
  const choiceMatch = CHOICE_LINE.exec(rawLines[0].trim())
  if (!choiceMatch) return { kind: 'complex', raw }

  const spokenTextRaw = choiceMatch[2].trim()
  const spokenText = spokenTextRaw.length > 0 ? spokenTextRaw : undefined

  const parts = choiceMatch[1].split('#').map((p) => p.trim())
  const choiceText = parts[0]
  const tagParts = parts.slice(1)
  if (tagParts.length > 1) return { kind: 'complex', raw }

  let insightTag: string | undefined
  if (tagParts.length === 1) {
    const tagMatch = /^insight:\s*(\S+)$/.exec(tagParts[0])
    if (!tagMatch) return { kind: 'complex', raw }
    insightTag = tagMatch[1]
  }

  const bodyLines = rawLines.slice(1)
  if (bodyLines.length === 0) return { kind: 'complex', raw }
  if (bodyLines[bodyLines.length - 1].trim() !== `-> ${knotName}`) return { kind: 'complex', raw }

  const responseLines = bodyLines.slice(0, -1)
  if (responseLines.length === 0) return { kind: 'complex', raw }

  let speakerNpcId: string | undefined
  const cleanedLines: string[] = []
  for (let i = 0; i < responseLines.length; i++) {
    const trimmed = responseLines[i].trim()
    if (trimmed === '') {
      cleanedLines.push('')
      continue
    }
    if (trimmed.startsWith('~') || trimmed.startsWith('{') || trimmed.startsWith('*') || trimmed.startsWith('+') || trimmed.startsWith('->')) {
      return { kind: 'complex', raw }
    }
    if (trimmed.includes('#')) {
      const speakerMatch = SPEAKER_LINE.exec(trimmed)
      if (!speakerMatch || speakerNpcId !== undefined || i !== responseLines.length - 1) {
        return { kind: 'complex', raw }
      }
      speakerNpcId = speakerMatch[2]
      cleanedLines.push(speakerMatch[1].trim())
      continue
    }
    cleanedLines.push(trimmed)
  }

  return { kind: 'simple', choiceText, insightTag, spokenText, responseText: cleanedLines.join('\n'), speakerNpcId }
}

/**
 * Parses `knotName`'s body out of `source` into a fixed preamble (narration
 * before the first choice), an ordered topic list, and a trailer (whatever
 * follows the last topic's self-divert up to the next knot header or EOF —
 * typically blank lines plus comments describing the *next* knot, preserved
 * verbatim so a save never eats them). Throws if the knot isn't found or is
 * ambiguous, same fail-closed posture as mapRecordSerializer.ts.
 */
export function parseTopicsKnot(source: string, knotName: string): ParsedTopicsKnot {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const headerIndex = findKnotHeaderIndex(lines, knotName)
  const bodyStart = headerIndex + 1
  const bodyEnd = findKnotBodyEnd(lines, bodyStart)
  const bodyLines = lines.slice(bodyStart, bodyEnd)

  const firstChoiceIndex = bodyLines.findIndex((l) => CHOICE_START.test(l.trim()))
  if (firstChoiceIndex === -1) {
    return { preambleLines: bodyLines, topics: [], trailerLines: [] }
  }

  const preambleLines = bodyLines.slice(0, firstChoiceIndex)

  const choiceIndices: number[] = []
  for (let i = firstChoiceIndex; i < bodyLines.length; i++) {
    if (CHOICE_START.test(bodyLines[i].trim())) choiceIndices.push(i)
  }

  const topics: TopicBlock[] = []
  let trailerLines: string[] = []
  for (let i = 0; i < choiceIndices.length; i++) {
    const start = choiceIndices[i]
    const end = i + 1 < choiceIndices.length ? choiceIndices[i + 1] : bodyLines.length
    let blockLines = bodyLines.slice(start, end)

    if (i === choiceIndices.length - 1) {
      const selfDivert = `-> ${knotName}`
      let cut = blockLines.length
      for (let j = blockLines.length - 1; j >= 0; j--) {
        if (blockLines[j].trim() === selfDivert) {
          cut = j + 1
          break
        }
      }
      trailerLines = blockLines.slice(cut)
      blockLines = blockLines.slice(0, cut)
    }

    topics.push(classifyBlock(blockLines, knotName))
  }

  return { preambleLines, topics, trailerLines }
}

function serializeTopic(topic: TopicBlock, knotName: string): string {
  if (topic.kind === 'complex') return topic.raw

  const tag = topic.insightTag ? ` # insight: ${topic.insightTag}` : ''
  const spoken = topic.spokenText ? ` ${topic.spokenText}` : ''
  const choiceLine = `* [${topic.choiceText}${tag}]${spoken}`

  const responseLines = topic.responseText.split('\n')
  const lastIndex = responseLines.length - 1
  const bodyLines = responseLines.map((line, i) => {
    if (line === '') return ''
    if (i === lastIndex && topic.speakerNpcId) return `    ${line} # speaker: npc:${topic.speakerNpcId}`
    return `    ${line}`
  })

  return [choiceLine, ...bodyLines, `    -> ${knotName}`].join('\n')
}

/** Inverse of `parseTopicsKnot` — reassembles a knot body from its parts, given a (possibly edited) topic list. */
export function serializeTopicsKnot(knotName: string, parsed: Omit<ParsedTopicsKnot, 'topics'>, topics: TopicBlock[]): string {
  const segments: string[] = []
  if (parsed.preambleLines.length > 0) segments.push(parsed.preambleLines.join('\n'))
  if (topics.length > 0) segments.push(topics.map((t) => serializeTopic(t, knotName)).join('\n'))
  if (parsed.trailerLines.length > 0) segments.push(parsed.trailerLines.join('\n'))
  return segments.join('\n')
}

/**
 * Replaces `knotName`'s body in `source` with a freshly serialized version
 * built from `topics`, preserving the knot's own preamble/trailer as parsed.
 * Matches the file's own line-ending convention (this codebase's content is
 * CRLF, same accommodation `mapRecordSerializer.ts`'s `replaceRecordById`
 * makes).
 */
export function replaceTopicsInKnot(source: string, knotName: string, topics: TopicBlock[]): string {
  const usesCrlf = source.includes('\r\n')
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const headerIndex = findKnotHeaderIndex(lines, knotName)
  const bodyStart = headerIndex + 1
  const bodyEnd = findKnotBodyEnd(lines, bodyStart)

  const parsed = parseTopicsKnot(source, knotName)
  const newBody = serializeTopicsKnot(knotName, parsed, topics)

  const newLines = [...lines.slice(0, bodyStart), ...(newBody.length > 0 ? newBody.split('\n') : []), ...lines.slice(bodyEnd)]
  const result = newLines.join('\n')
  return usesCrlf ? result.replace(/\n/g, '\r\n') : result
}
