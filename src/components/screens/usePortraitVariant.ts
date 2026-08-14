// Tracks the active NPC portrait variant (docs/NPC_PORTRAIT_VARIANTS_SPEC.md)
// from the most recent `# portrait: <variantId>` line tag — shared by
// DialogueScreen and ConversationScreen, same "shared bookkeeping hook"
// precedent as useTranscript.ts. Holds the last-seen variant until the next
// tag, and resets to the NPC's default (`neutral`) the moment the on-stage
// NPC changes, so a variant id never carries over onto a different NPC's
// portrait.

import { useEffect, useState } from 'react'
import type { NpcId } from '../../content/npcs'
import type { StoryLine } from '../../stores/storyStore'

export function usePortraitVariant(npcId: NpcId | null, currentLines: StoryLine[]): string | null {
  const [variantId, setVariantId] = useState<string | null>(null)

  useEffect(() => {
    setVariantId(null)
  }, [npcId])

  useEffect(() => {
    const tagged = currentLines.filter((l) => l.portrait !== null)
    if (tagged.length > 0) setVariantId(tagged[tagged.length - 1].portrait)
  }, [currentLines])

  return variantId
}
