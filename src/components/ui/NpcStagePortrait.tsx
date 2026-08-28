// The large center-stage NPC portrait treatment (docs/GAME_GUIDE.md §2.1) —
// shared by DialogueScreen and ConversationScreen (UI_PASS_SPEC.md §4.4;
// previously hand-rolled once inside DialogueScreen only). Bleeds full-height
// to the bottom of its stage area with no frame/border, so the backdrop art
// behind it stays visible around the character. Manages its own
// missing/failed-art fallback (degrades to the location-name label, same
// tolerance PortraitFrame already has) keyed off `npcId` so callers don't
// need to reset anything themselves when the speaker changes.

import { useEffect, useState } from 'react'
import { NPCS, type NpcId } from '../../content/npcs'

export interface NpcStagePortraitProps {
  npcId: NpcId | null
  /** Shown in place of art when npcId is null or its art fails to load (e.g. a location name). */
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
  // Tracks the one-shot intro clip (if this variant has one): starts
  // 'playing' each time the clip changes, moves to 'done' once it ends or
  // fails to load — either way settling on the plain static image, same as
  // an NPC/variant with no clip configured at all.
  const [videoState, setVideoState] = useState<'playing' | 'done'>('playing')

  useEffect(() => {
    setLoadFailed(false)
  }, [npcId, variantId])

  const npc = npcId ? NPCS[npcId] : undefined
  const portraits = npc?.portraits
  const requestedVariant = variantId ?? 'neutral'
  const resolvedVariant = portraits && portraits[requestedVariant] !== undefined ? requestedVariant : 'neutral'
  const src = portraits?.[resolvedVariant]
  const introVideo = npc?.portraitVideos?.[resolvedVariant]

  useEffect(() => {
    setVideoState('playing')
  }, [introVideo])

  const showVideo = introVideo !== undefined && videoState === 'playing'

  return (
    <div className="flex h-full items-end justify-end">
      {npcId && !loadFailed ? (
        <div className="relative h-full w-[600px] overflow-hidden">
          {/* Underneath the whole time (not just once the clip ends) so it's
              already decoded and ready the moment the crossfade starts —
              swapping `src` in only on 'done' would flash a blank frame. */}
          <img
            src={src}
            alt={npc?.name}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
            onError={() => setLoadFailed(true)}
          />
          {introVideo && (
            <video
              key={introVideo}
              src={introVideo}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
              onEnded={() => setVideoState('done')}
              onError={() => setVideoState('done')}
            />
          )}
        </div>
      ) : (
        <span className="pb-6 font-display text-xs uppercase tracking-widest text-white/40">{fallbackLabel}</span>
      )}
    </div>
  )
}
