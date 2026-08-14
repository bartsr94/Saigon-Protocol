// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePortraitVariant } from './usePortraitVariant'
import type { NpcId } from '../../content/npcs'
import type { StoryLine } from '../../stores/storyStore'

function line(portrait: string | null): StoryLine {
  return {
    text: 'Text.',
    speaker: { type: 'narrator' },
    background: null,
    portrait,
    music: null,
    ambienceOps: { add: [], remove: [], clear: false },
    voice: null,
  }
}

describe('usePortraitVariant', () => {
  it('starts null (default/neutral) when no portrait tag has fired yet', () => {
    const { result } = renderHook(({ npcId, lines }: { npcId: NpcId | null; lines: StoryLine[] }) => usePortraitVariant(npcId, lines), {
      initialProps: { npcId: 'lakshmiAvani' as NpcId | null, lines: [] as StoryLine[] },
    })
    expect(result.current).toBeNull()
  })

  it('adopts the variant from a tagged line in the batch', () => {
    const { result, rerender } = renderHook(
      ({ npcId, lines }: { npcId: NpcId | null; lines: StoryLine[] }) => usePortraitVariant(npcId, lines),
      { initialProps: { npcId: 'lakshmiAvani' as NpcId | null, lines: [] as StoryLine[] } },
    )
    rerender({ npcId: 'lakshmiAvani', lines: [line('warm')] })
    expect(result.current).toBe('warm')
  })

  it('holds the last variant across a batch with no portrait tag', () => {
    const { result, rerender } = renderHook(
      ({ npcId, lines }: { npcId: NpcId | null; lines: StoryLine[] }) => usePortraitVariant(npcId, lines),
      { initialProps: { npcId: 'lakshmiAvani' as NpcId | null, lines: [line('bright')] } },
    )
    expect(result.current).toBe('bright')

    rerender({ npcId: 'lakshmiAvani', lines: [line(null)] })
    expect(result.current).toBe('bright')
  })

  it('takes the last tagged line when a batch carries more than one', () => {
    const { result, rerender } = renderHook(
      ({ npcId, lines }: { npcId: NpcId | null; lines: StoryLine[] }) => usePortraitVariant(npcId, lines),
      { initialProps: { npcId: 'lakshmiAvani' as NpcId | null, lines: [] as StoryLine[] } },
    )
    rerender({ npcId: 'lakshmiAvani', lines: [line('blush'), line(null), line('guarded')] })
    expect(result.current).toBe('guarded')
  })

  it('resets to null (default/neutral) when the on-stage NPC changes and the new batch carries no tag of its own', () => {
    const { result, rerender } = renderHook(
      ({ npcId, lines }: { npcId: NpcId | null; lines: StoryLine[] }) => usePortraitVariant(npcId, lines),
      { initialProps: { npcId: 'lakshmiAvani' as NpcId | null, lines: [line('love')] } },
    )
    expect(result.current).toBe('love')

    rerender({ npcId: 'meiHong', lines: [line(null)] })
    expect(result.current).toBeNull()
  })
})
