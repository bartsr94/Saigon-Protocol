import type { Attributes } from '../stores/characterStore'

export interface AttributeVoiceInfo {
  attribute: keyof Attributes
  label: string
  /** One-line personality reference for ink authors writing new voice lines — tone, not mechanics. */
  tone: string
  textClass: string
  borderClass: string
}

// Placeholder accent colors — one per attribute, just distinct enough to tell
// voices apart in the dialogue column. Not a palette decision; that's a
// separate visual-direction pass (see DISCO_ELYSIUM_UI_SPEC.md §3/§8).
export const ATTRIBUTE_VOICES: Record<keyof Attributes, AttributeVoiceInfo> = {
  strength: {
    attribute: 'strength',
    label: 'Strength',
    tone: 'Blunt and impatient. Sizes people up by what they could take in a fight, not what they say. Wants the direct route even when it isn’t the smart one.',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-400/40',
  },
  dexterity: {
    attribute: 'dexterity',
    label: 'Dexterity',
    tone: 'Wired for the body — angles, exits, the half-second before something moves. Impatient with anyone standing still.',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-400/40',
  },
  endurance: {
    attribute: 'endurance',
    label: 'Endurance',
    tone: 'Grim and unsentimental about what the body can absorb. Tracks cost, not comfort — what this is going to take out of you.',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-400/40',
  },
  intellect: {
    attribute: 'intellect',
    label: 'Intellect',
    tone: 'Cold and pattern-hungry. Treats people and rooms as puzzles with a solution, and doesn’t much like being told a puzzle has none.',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-400/40',
  },
  education: {
    attribute: 'education',
    label: 'Education',
    tone: 'Procedural. Measures a situation against what the training said should happen, and gets uneasy when reality doesn’t match it.',
    textClass: 'text-violet-400',
    borderClass: 'border-violet-400/40',
  },
  socialStanding: {
    attribute: 'socialStanding',
    label: 'Social Standing',
    tone: 'Reads a room for hierarchy — who’s owed, who’s owing, who actually holds the leash. Contemptuous of anyone who doesn’t know their place in it.',
    textClass: 'text-fuchsia-400',
    borderClass: 'border-fuchsia-400/40',
  },
}

export function voiceForKey(key: string | null): AttributeVoiceInfo | null {
  if (!key) return null
  return key in ATTRIBUTE_VOICES ? ATTRIBUTE_VOICES[key as keyof Attributes] : null
}
