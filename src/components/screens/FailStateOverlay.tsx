import { useEffect } from 'react'
import { useInsightStore } from '../../stores/insightStore'
import { useUiStore } from '../../stores/uiStore'
import { useStoryStore } from '../../stores/storyStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSaveStore } from '../../stores/saveStore'
import { useAudioStore } from '../../stores/audioStore'
import { useCasefileStore } from '../../stores/casefileStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { CyberButton, Panel } from '../ui'
import { LOCATIONS } from '../../content/locations'

function failCopy(failState: 'vitality' | 'composure') {
  if (failState === 'vitality') {
    return {
      title: 'Vitality Depleted',
      body: 'The case got physical faster than the badge could keep up. This run is over.',
    }
  }
  return {
    title: 'Composure Broken',
    body: 'The pressure cracked the investigation before you could stabilize it. This run is over.',
  }
}

export function FailStateOverlay() {
  const failState = useInsightStore((s) => s.failState)
  const resetInsight = useInsightStore((s) => s.reset)
  const resetCasefile = useCasefileStore((s) => s.reset)
  const resetGameplay = useGameplayStore((s) => s.reset)
  const goToTitle = useUiStore((s) => s.goToTitle)
  const goToGame = useUiStore((s) => s.goToGame)
  const closeOverlay = useUiStore((s) => s.closeOverlay)
  const loadMostRecent = useSaveStore((s) => s.loadMostRecent)
  const slots = useSaveStore((s) => s.slots)
  const refreshSlots = useSaveStore((s) => s.refreshSlots)

  useEffect(() => {
    refreshSlots()
  }, [refreshSlots])

  if (!failState) return null

  const copy = failCopy(failState)
  const canLoad = slots.length > 0

  function handleReturnToTitle() {
    useNavigationStore.getState().reset()
    useStoryStore.getState().reset()
    useAudioStore.getState().enterOverworld()
    closeOverlay()
    resetInsight()
    resetGameplay()
    resetCasefile()
    goToTitle()
  }

  function handleLoadMostRecent() {
    refreshSlots()
    if (!loadMostRecent()) return
    if (!useStoryStore.getState().story) {
      const selectedLocationId = useNavigationStore.getState().selectedLocationId
      if (selectedLocationId) {
        useAudioStore.getState().enterLocation(LOCATIONS[selectedLocationId])
      } else {
        useAudioStore.getState().enterOverworld()
      }
    }
    closeOverlay()
    goToGame()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <Panel size="md" className="flex w-full max-w-lg flex-col gap-5 p-6">
        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold uppercase tracking-widest text-[#ff0055]">{copy.title}</h1>
          <p className="font-body text-sm text-white/70">{copy.body}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <CyberButton onClick={handleReturnToTitle}>Return to Title</CyberButton>
          <CyberButton disabled={!canLoad} title={canLoad ? undefined : 'No save data yet'} onClick={handleLoadMostRecent}>
            Load Most Recent
          </CyberButton>
        </div>
      </Panel>
    </div>
  )
}
