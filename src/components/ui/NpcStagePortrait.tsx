// The large center-stage NPC portrait treatment (docs/GAME_GUIDE.md §2.1) —
// shared by DialogueScreen and ConversationScreen (UI_PASS_SPEC.md §4.4;
// previously hand-rolled once inside DialogueScreen only). Manages its own
// missing/failed-art fallback (degrades to just the name label, same
// tolerance PortraitFrame already has) keyed off `npcId` so callers don't
// need to reset anything themselves when the speaker changes.

import { useEffect, useState } from 'react'
import { NPCS, type NpcId } from '../../content/npcs'

export interface NpcStagePortraitProps {
  npcId: NpcId | null
  /** Shown as the label under the portrait, and in place of art when npcId is null (e.g. a location name). */
  fallbackLabel: string
  /**
   * Which of `npcId`'s `portraits` variants to show
   * (docs/NPC_PORTRAIT_VARIANTS_SPEC.md) — null/omitted, or a value that
   * isn't one of this NPC's variant keys, falls back to their `neutral`
   * entry.
   */
  variantId?: string | null
}

export function NpcStagePortrait({ npcId, fallbackLabel, variantId }: NpcStagePortraitProps) {
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    setLoadFailed(false)
  }, [npcId, variantId])

  const portraits = npcId ? NPCS[npcId].portraits : undefined
  const src = portraits ? (portraits[variantId ?? 'neutral'] ?? portraits.neutral) : undefined

  return (
    <div className="flex h-full flex-col items-center justify-end gap-3">
      {npcId && !loadFailed && (
        <div
          className="relative h-[840px] w-[600px] max-h-[90%] translate-x-[100px] overflow-hidden bg-black/40"
          style={{
            clipPath: 'polygon(28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%, 0 28px)',
            border: '2px solid color-mix(in srgb, var(--color-chrome-primary) 50%, transparent)',
            boxShadow:
              '0 0 30px color-mix(in srgb, var(--color-chrome-primary) 20%, transparent), inset 0 0 40px color-mix(in srgb, var(--color-chrome-primary) 10%, transparent)',
          }}
        >
          <img src={src} alt={NPCS[npcId].name} className="h-full w-full object-cover" onError={() => setLoadFailed(true)} />
        </div>
      )}
      <span className="font-display text-xs uppercase tracking-widest text-white/40">{npcId ? NPCS[npcId].name : fallbackLabel}</span>
    </div>
  )
}
