// Save/Persistence Layer (Architecture §8, docs/GAME_GUIDE.md §7).
// Owns localStorage I/O for save slots: one system-managed Autosave slot
// plus player-named manual slots. No index file — refreshSlots() scans
// localStorage for SAVE_KEY_PREFIX-prefixed keys directly, since the save
// count stays small enough that a separate index would just be a second
// thing to keep in sync.
//
// Deliberately has no knowledge of uiStore — it doesn't call goToGame() or
// closeOverlay() itself. Callers (TitleScreen, SettingsOverlay) do that
// after a successful load, the same seam navigationStore/storyStore already
// use to keep the handoff at the component layer.

import { create } from 'zustand'
import introStoryJson from '../../content/ink/intro.json'
import { LOCATION_STORY_JSON } from '../content/locationStories'
import type { LocationId } from '../content/locations'
import {
  AUTOSAVE_SLOT_ID,
  parseSaveBlob,
  storageKey,
  summarizeSlot,
  SAVE_FORMAT_VERSION,
  SAVE_KEY_PREFIX,
  type SaveBlob,
  type SaveSlotKind,
  type SaveSlotMeta,
} from '../engine/saveEngine'
import { useInsightStore } from './insightStore'
import { useNavigationStore } from './navigationStore'
import { useStoryStore } from './storyStore'

interface SaveState {
  slots: SaveSlotMeta[]

  refreshSlots: () => void
  hasAnySave: () => boolean
  autosave: () => void
  saveToSlot: (name: string, slotId?: string) => void
  loadSlot: (id: string) => boolean
  loadMostRecent: () => boolean
  deleteSlot: (id: string) => void
}

function getStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage
}

function generateSlotId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Maps a saved storyStore.activeStoryId back to the compiled JSON that produced it, so loadSlot restores against the same story the ink state was serialized from — not always the same throwaway fixture. */
function resolveStoryJson(storyId: string): Record<string, unknown> | null {
  if (storyId === 'intro') return introStoryJson
  if (storyId in LOCATION_STORY_JSON) return LOCATION_STORY_JSON[storyId as LocationId]
  return null
}

function readAllBlobs(storage: Storage): { id: string; blob: SaveBlob }[] {
  const entries: { id: string; blob: SaveBlob }[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key?.startsWith(SAVE_KEY_PREFIX)) continue
    const blob = parseSaveBlob(storage.getItem(key))
    if (blob) entries.push({ id: key.slice(SAVE_KEY_PREFIX.length), blob })
  }
  return entries
}

function captureBlob(kind: SaveSlotKind, name: string): SaveBlob | null {
  const insight = useInsightStore.getState()
  if (!insight.archetype) return null // nothing to save before chargen commits an archetype

  const navigation = useNavigationStore.getState()
  const story = useStoryStore.getState().story

  return {
    version: SAVE_FORMAT_VERSION,
    savedAt: Date.now(),
    name,
    kind,
    insight: {
      archetype: insight.archetype,
      playerName: insight.playerName,
      levels: insight.levels,
      freePointsRemaining: insight.freePointsRemaining,
      vitality: insight.vitality,
      composure: insight.composure,
      consumedRedChecks: [...insight.consumedRedChecks],
      failState: insight.failState,
    },
    navigation: {
      unlockedLocationIds: [...navigation.unlockedLocationIds],
      selectedLocationId: navigation.selectedLocationId,
    },
    inkStateJson: story ? story.state.ToJson() : null,
    activeStoryId: story ? useStoryStore.getState().activeStoryId : null,
  }
}

export const useSaveStore = create<SaveState>((set, get) => ({
  slots: [],

  refreshSlots: () => {
    const storage = getStorage()
    if (!storage) return
    const slots = readAllBlobs(storage)
      .map(({ id, blob }) => summarizeSlot(id, blob))
      .sort((a, b) => b.savedAt - a.savedAt)
    set({ slots })
  },

  hasAnySave: () => {
    const storage = getStorage()
    if (!storage) return false
    return readAllBlobs(storage).length > 0
  },

  autosave: () => {
    const storage = getStorage()
    if (!storage) return
    const blob = captureBlob('autosave', 'Autosave')
    if (!blob) return
    storage.setItem(storageKey(AUTOSAVE_SLOT_ID), JSON.stringify(blob))
    get().refreshSlots()
  },

  saveToSlot: (name, slotId) => {
    const storage = getStorage()
    if (!storage) return
    const blob = captureBlob('manual', name)
    if (!blob) return
    storage.setItem(storageKey(slotId ?? generateSlotId()), JSON.stringify(blob))
    get().refreshSlots()
  },

  loadSlot: (id) => {
    const storage = getStorage()
    if (!storage) return false
    const blob = parseSaveBlob(storage.getItem(storageKey(id)))
    if (!blob) return false

    useInsightStore.getState().hydrate(blob.insight)
    useNavigationStore.getState().hydrate(blob.navigation)
    const storyJson = blob.activeStoryId ? resolveStoryJson(blob.activeStoryId) : null
    if (blob.inkStateJson && storyJson) {
      useStoryStore.getState().loadStory(storyJson, blob.inkStateJson, blob.activeStoryId)
    } else {
      useStoryStore.getState().reset()
    }
    return true
  },

  loadMostRecent: () => {
    get().refreshSlots()
    const target = get().slots[0]
    if (!target) return false
    return get().loadSlot(target.id)
  },

  deleteSlot: (id) => {
    const storage = getStorage()
    if (!storage) return
    storage.removeItem(storageKey(id))
    get().refreshSlots()
  },
}))
