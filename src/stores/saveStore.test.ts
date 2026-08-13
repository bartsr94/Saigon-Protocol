import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSaveStore } from './saveStore'
import { useInsightStore } from './insightStore'
import { useNavigationStore } from './navigationStore'
import { useStoryStore } from './storyStore'
import { useCasefileStore } from './casefileStore'
import { useGameplayStore } from './gameplayStore'
import { useThoughtStore } from './thoughtStore'
import { useRelationshipStore } from './relationshipStore'
import { AUTOSAVE_SLOT_ID } from '../engine/saveEngine'
import noodleStallJson from '../../content/ink/noodleStall.json'
import introStoryJson from '../../content/ink/intro.json'

class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

describe('saveStore', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
    useInsightStore.setState(useInsightStore.getInitialState(), true)
    useNavigationStore.setState(useNavigationStore.getInitialState(), true)
    useStoryStore.getState().reset()
    useCasefileStore.setState(useCasefileStore.getInitialState(), true)
    useGameplayStore.setState(useGameplayStore.getInitialState(), true)
    useThoughtStore.setState(useThoughtStore.getInitialState(), true)
    useRelationshipStore.setState(useRelationshipStore.getInitialState(), true)
    useSaveStore.setState(useSaveStore.getInitialState(), true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('autosave and saveToSlot no-op without an archetype selected', () => {
    useSaveStore.getState().autosave()
    useSaveStore.getState().saveToSlot('Too early')
    expect(useSaveStore.getState().hasAnySave()).toBe(false)
  })

  it('autosave writes to the fixed Autosave slot and is idempotent by id', () => {
    useInsightStore.getState().selectArchetype('hustler')
    useSaveStore.getState().autosave()
    useSaveStore.getState().autosave()

    const { slots } = useSaveStore.getState()
    expect(slots).toHaveLength(1)
    expect(slots[0].id).toBe(AUTOSAVE_SLOT_ID)
    expect(slots[0].kind).toBe('autosave')
  })

  it('saveToSlot creates a new manual slot, and overwrites when given an existing id', () => {
    useInsightStore.getState().selectArchetype('hustler')
    useSaveStore.getState().saveToSlot('First Save')
    expect(useSaveStore.getState().slots).toHaveLength(1)
    const slotId = useSaveStore.getState().slots[0].id

    useSaveStore.getState().saveToSlot('Second Save')
    expect(useSaveStore.getState().slots).toHaveLength(2)

    useSaveStore.getState().saveToSlot('First Save (renamed)', slotId)
    const { slots } = useSaveStore.getState()
    expect(slots).toHaveLength(2)
    expect(slots.find((s) => s.id === slotId)?.name).toBe('First Save (renamed)')
  })

  it('loadSlot rehydrates insight, navigation, and thought-cabinet state, and returns false for a missing id', () => {
    useInsightStore.getState().selectArchetype('hustler')
    useInsightStore.getState().setPlayerName('Kade')
    useInsightStore.getState().rollCheck('hustle', 6, 'snapshot-check', 'white') // partial XP progress
    useNavigationStore.getState().unlockLocation('noodleStall')
    useGameplayStore.getState().enterHub('checkpoint')
    useCasefileStore.getState().addEvidence('drone-log')
    useCasefileStore.getState().unlockNote('note-01')
    useThoughtStore.getState().unlockThought('checkpoint-improviser')
    useThoughtStore.getState().enableThought('checkpoint-improviser')
    useRelationshipStore.getState().adjustAffinity('lakshmiAvani', 3)
    useSaveStore.getState().saveToSlot('Snapshot')
    const slotId = useSaveStore.getState().slots[0].id

    // Mutate state after saving, then confirm loadSlot restores the snapshot.
    useInsightStore.getState().setPlayerName('Someone Else')
    useNavigationStore.getState().unlockLocation('deltaSquat')
    useGameplayStore.getState().enterHub('deltaSquat')
    useCasefileStore.getState().addEvidence('water-sample')
    useCasefileStore.getState().unlockNote('note-02')
    useThoughtStore.getState().unlockThought('company-man-doubt')
    useThoughtStore.getState().enableThought('company-man-doubt')
    useThoughtStore.getState().disableThought('checkpoint-improviser')
    useRelationshipStore.getState().adjustAffinity('lakshmiAvani', -5)

    expect(useSaveStore.getState().loadSlot(slotId)).toBe(true)
    expect(useInsightStore.getState().playerName).toBe('Kade')
    expect(useInsightStore.getState().xp.hustle).toBe(1)
    expect(useNavigationStore.getState().unlockedLocationIds.has('noodleStall')).toBe(true)
    expect(useNavigationStore.getState().unlockedLocationIds.has('deltaSquat')).toBe(false)
    expect(useGameplayStore.getState().currentHubId).toBe('checkpoint')
    expect(useCasefileStore.getState().evidenceIds.has('drone-log')).toBe(true)
    expect(useCasefileStore.getState().evidenceIds.has('water-sample')).toBe(false)
    expect(useCasefileStore.getState().noteIds.has('note-01')).toBe(true)
    expect(useCasefileStore.getState().noteIds.has('note-02')).toBe(false)
    expect(useThoughtStore.getState().isEnabled('checkpoint-improviser')).toBe(true)
    expect(useThoughtStore.getState().isUnlocked('company-man-doubt')).toBe(false)
    expect(useRelationshipStore.getState().affinity.lakshmiAvani).toBe(3)

    expect(useSaveStore.getState().loadSlot('does-not-exist')).toBe(false)
  })

  it('loadSlot restores a save captured mid-scene against the same compiled story it was saved from, not an unrelated fixture', () => {
    useInsightStore.getState().selectArchetype('hustler')
    useNavigationStore.getState().unlockLocation('noodleStall')
    useNavigationStore.getState().selectLocation('noodleStall')
    useStoryStore.getState().loadStory(noodleStallJson, undefined, 'noodleStall')
    useStoryStore.getState().choose(0) // advance past the opening so the saved ink state isn't just the start position

    useSaveStore.getState().autosave()

    // Simulate a fresh session: story gone, insight/navigation state reset.
    useStoryStore.getState().reset()
    useInsightStore.setState(useInsightStore.getInitialState(), true)
    useNavigationStore.setState(useNavigationStore.getInitialState(), true)

    expect(useSaveStore.getState().loadSlot(AUTOSAVE_SLOT_ID)).toBe(true)
    expect(useStoryStore.getState().activeStoryId).toBe('noodleStall')
    expect(useStoryStore.getState().story).not.toBeNull()
    // Restoring against the wrong compiled story throws inside inkjs before
    // any lines/choices are ever produced — reaching this assertion at all
    // proves the right JSON was used.
    expect(useStoryStore.getState().ended || useStoryStore.getState().currentChoices.length > 0).toBe(true)
  })

  it('loadSlot restores an intro-scene save the same way', () => {
    useInsightStore.getState().selectArchetype('companyMan')
    useStoryStore.getState().loadStory(introStoryJson, undefined, 'intro')
    useStoryStore.getState().choose(0)

    useSaveStore.getState().autosave()
    useStoryStore.getState().reset()

    expect(useSaveStore.getState().loadSlot(AUTOSAVE_SLOT_ID)).toBe(true)
    expect(useStoryStore.getState().activeStoryId).toBe('intro')
    expect(useStoryStore.getState().story).not.toBeNull()
  })

  it('hasAnySave and loadMostRecent reflect current storage', () => {
    expect(useSaveStore.getState().hasAnySave()).toBe(false)
    expect(useSaveStore.getState().loadMostRecent()).toBe(false)

    useInsightStore.getState().selectArchetype('enforcer')
    useSaveStore.getState().saveToSlot('Only Save')
    expect(useSaveStore.getState().hasAnySave()).toBe(true)
    expect(useSaveStore.getState().loadMostRecent()).toBe(true)
  })

  it('deleteSlot removes it from subsequent listings', () => {
    useInsightStore.getState().selectArchetype('hustler')
    useSaveStore.getState().saveToSlot('Doomed Save')
    const slotId = useSaveStore.getState().slots[0].id

    useSaveStore.getState().deleteSlot(slotId)
    expect(useSaveStore.getState().slots).toHaveLength(0)
    expect(useSaveStore.getState().hasAnySave()).toBe(false)
  })
})
