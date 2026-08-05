import { useCharacterStore } from './characterStore'
import { useStoryStore } from './storyStore'
import { useNavigationStore } from './navigationStore'

const SAVE_KEY = 'saigon-protocol-save'

interface SaveBlob {
  version: 1
  character: ReturnType<typeof useCharacterStore.getState>['character']
  inkState: string | null
  unlockedLocationIds: string[]
  selectedLocationId: string | null
  flags: Record<string, boolean>
}

export function saveGame(): void {
  const { character } = useCharacterStore.getState()
  const { story } = useStoryStore.getState()
  const { unlockedLocationIds, selectedLocationId, flags } = useNavigationStore.getState()

  const blob: SaveBlob = {
    version: 1,
    character,
    inkState: story ? story.state.toJson() : null,
    unlockedLocationIds,
    selectedLocationId,
    flags,
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(blob))
}

export function loadGame(): SaveBlob | null {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return null
  return JSON.parse(raw) as SaveBlob
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null
}
