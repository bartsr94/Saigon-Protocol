import { useCharacterStore } from './characterStore'
import { useStoryStore } from './storyStore'
import { useNavigationStore } from './navigationStore'
import { validateSaveBlob } from '../engine/saveValidation'

const SAVE_KEY = 'saigon-protocol-save'

export interface SaveBlob {
  version: 1
  character: ReturnType<typeof useCharacterStore.getState>['character']
  inkState: string | null
  // inkjs's own currentText only reflects the most recent Continue() call, not
  // the accumulated paragraphs shown since the last choice — so the displayed
  // text is captured here directly rather than re-derived from ink state on load.
  storyText: string[]
  unlockedLocationIds: string[]
  selectedLocationId: string | null
  flags: Record<string, boolean>
}

export function saveGame(): void {
  const { character } = useCharacterStore.getState()
  const { story, currentText } = useStoryStore.getState()
  const { unlockedLocationIds, selectedLocationId, flags } = useNavigationStore.getState()

  const blob: SaveBlob = {
    version: 1,
    character,
    inkState: story ? story.state.toJson() : null,
    storyText: story ? currentText.map((line) => line.text) : [],
    unlockedLocationIds,
    selectedLocationId,
    flags,
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(blob))
}

export function loadGame(): SaveBlob | null {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return null

  try {
    return validateSaveBlob(JSON.parse(raw))
  } catch (error) {
    console.error('Discarding corrupt or incompatible save.', error)
    localStorage.removeItem(SAVE_KEY)
    return null
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null
}
