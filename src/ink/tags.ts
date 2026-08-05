export interface ChoiceCheckTag {
  skill: string
  targetNumber: number
  once: boolean
}

export interface ParsedChoiceText {
  displayText: string
  check: ChoiceCheckTag | null
}

function findTag(tags: string[] | null, prefix: string): string | null {
  const tag = tags?.find((t) => t.startsWith(prefix))
  return tag ? tag.slice(prefix.length).trim() : null
}

export function parseCombatTag(tags: string[] | null): string | null {
  return findTag(tags, 'combat:')
}

export function parseVoiceTag(tags: string[] | null): string | null {
  return findTag(tags, 'voice:')
}

// Trailing tags on a choice line (`* [text] # tag`) compile into the content
// that plays *after* the choice is picked, not onto Choice.tags — so they
// can't drive a pre-click odds preview. Check metadata is instead encoded
// as trailing plain text inside the choice's own brackets, e.g.
// `* [Force the issue (CHECK Tactics 10 once)]`, and stripped back out of
// the display text here.
const CHECK_MARKER = /\s*\(CHECK\s+(\S+)\s+(\d+)(?:\s+(once))?\)\s*$/i

export function parseChoiceCheckMarker(text: string): ParsedChoiceText {
  const match = text.match(CHECK_MARKER)
  if (!match || match.index === undefined) return { displayText: text, check: null }

  const [, skill, targetNumberRaw, onceFlag] = match
  return {
    displayText: text.slice(0, match.index).trimEnd(),
    check: { skill, targetNumber: Number(targetNumberRaw), once: Boolean(onceFlag) },
  }
}
