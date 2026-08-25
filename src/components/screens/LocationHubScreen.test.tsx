// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import '../../test/mediaPlaybackStub'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { useCaseStore } from '../../stores/caseStore'
import { useConversationStore } from '../../stores/conversationStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useInsightStore } from '../../stores/insightStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useRelationshipStore } from '../../stores/relationshipStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useStoryStore } from '../../stores/storyStore'
import { ConversationScreen } from './ConversationScreen'
import { LocationHubScreen } from './LocationHubScreen'

// Mirrors App.tsx's own storyMode screen switch (Architecture §7,
// UI_PASS_SPEC.md §4), scoped down to just the two screens this suite
// exercises, so the test drives Talk -> Conversation View -> "Leave
// Conversation" -> Talk again through the real LocationHubScreen /
// ConversationScreen wiring — not just storyStore in isolation — the same
// path a real player takes and the one storyStore.test.ts's regression
// coverage can't reach on its own.
function Harness() {
  const story = useStoryStore((s) => s.story)
  const storyMode = useStoryStore((s) => s.storyMode)
  if (story && storyMode === 'conversation') return <ConversationScreen />
  return <LocationHubScreen />
}

// jsdom doesn't implement Element.scrollTo — useTranscript's auto-scroll
// effect calls it on every log update, unreached by any existing test since
// none of them mount ConversationScreen/DialogueScreen with a real DOM ref.
Element.prototype.scrollTo = () => {}

afterEach(() => {
  cleanup()
  useGameplayStore.getState().reset()
  useStoryStore.getState().reset()
  useConversationStore.getState().reset()
  useRelationshipStore.getState().reset()
  useCaseStore.getState().reset()
  useNavigationStore.getState().reset()
  useInsightStore.setState(useInsightStore.getInitialState(), true)
  useSettingsStore.getState().setInstantText(false)
})

describe('LocationHubScreen + ConversationScreen — Talk / Leave / Talk again', () => {
  it('still shows Lakshmi Avani\'s greeting on a repeat visit after leaving and returning, not just bare topic buttons', async () => {
    const user = userEvent.setup()
    useSettingsStore.getState().setInstantText(true) // skip the typewriter reveal, deterministic assertions
    useInsightStore.getState().selectArchetype('hustler')
    // Already met from an earlier session, at the top affinity tier — same
    // starting point as the reported bug (checkpoint.ink's
    // lakshmi_avani_topics greeting).
    useConversationStore.getState().markMet('lakshmiAvani')
    useRelationshipStore.getState().adjustAffinity('lakshmiAvani', 10)
    useGameplayStore.getState().enterHub('checkpoint')
    useGameplayStore.setState({ playerPosition: { x: 10, y: 1 } }) // checkpoint-lakshmi-avani's POI tile (content/locationHubs.ts)

    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /Lakshmi Avani/ }))
    expect(await screen.findByText(/You actually came back\./)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Leave Conversation' }))
    await user.click(screen.getByRole('button', { name: /Lakshmi Avani/ }))

    expect(await screen.findByText(/You actually came back\./)).toBeInTheDocument()
  })
})

// Regression coverage for two Ophelia-arc bugs (OPHELIA_LIVESTREAM_ARC_SPEC.md)
// only ever surfaced by an NPC with a topic loop at more than one location —
// every other NPC's topic loop lives at a single location, so neither bug
// could have shown up against them.
describe('LocationHubScreen + ConversationScreen — location unlocks and per-location conversation state', () => {
  it('unlocks a flag-gated location when a Conversation View session ends, not just a DialogueScreen scene', async () => {
    // Same trigger point DialogueScreen.finalizeEndedScene already covers —
    // this is the one that was missing: leaving a topic-loop conversation
    // (not a first-encounter scene) with the gating flag set.
    useSettingsStore.getState().setInstantText(true)
    useInsightStore.getState().selectArchetype('hustler')
    useConversationStore.getState().markMet('ophelia')
    useCaseStore.getState().setFlag('ophelia-stream-agreed')
    useGameplayStore.getState().enterHub('turtleLakePlaza')
    useGameplayStore.setState({ playerPosition: { x: 2, y: 3 } }) // turtle-lake-plaza-ophelia's POI tile (content/locationHubs.ts)

    render(<Harness />)

    await userEvent.setup().click(screen.getByRole('button', { name: /Ophelia/ }))
    expect(await screen.findByText(/Ophelia's bench by the fountain is somebody else's tonight/)).toBeInTheDocument()
    expect(useNavigationStore.getState().unlockedLocationIds.has('opheliaApartment')).toBe(false)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Leave Conversation' }))

    expect(useNavigationStore.getState().unlockedLocationIds.has('opheliaApartment')).toBe(true)
  })

  it("keeps Ophelia's Turtle Lake and apartment topic loops independent, so visiting one doesn't resume the other's cached ink state", async () => {
    useSettingsStore.getState().setInstantText(true)
    useInsightStore.getState().selectArchetype('hustler')
    useConversationStore.getState().markMet('ophelia')
    useCaseStore.getState().setFlag('ophelia-stream-agreed')
    useGameplayStore.getState().enterHub('turtleLakePlaza')
    useGameplayStore.setState({ playerPosition: { x: 2, y: 3 } })

    render(<Harness />)
    const user = userEvent.setup()

    // Visit and leave Turtle Lake first, so a saved conversation state
    // exists under her npcId — the collision this test guards against only
    // shows up once there's cached state to wrongly reuse.
    await user.click(screen.getByRole('button', { name: /Ophelia/ }))
    expect(await screen.findByText(/Ophelia's bench by the fountain is somebody else's tonight/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Leave Conversation' }))

    // Mid-test store writes outside any React event handler don't flush
    // synchronously with a bare userEvent query right after — act() forces
    // the pending re-render (new hub's grid/POIs) to commit before the next
    // query runs, or getByRole below can return a stale, about-to-be-replaced
    // button from the previous hub that a click no longer reaches.
    act(() => {
      useGameplayStore.getState().enterHub('opheliaApartment')
      useGameplayStore.setState({ playerPosition: { x: 2, y: 3 } }) // ophelia-apartment-ophelia's POI tile
    })

    await user.click(screen.getByRole('button', { name: /Ophelia/ }))

    // The apartment's own first-visit content (ophelia_stream_scene), not
    // Turtle Lake's cached "she's relocated" line replayed via a mismatched
    // inkjs state restore.
    expect(await screen.findByText(/Her apartment is smaller than the persona/)).toBeInTheDocument()
    expect(screen.queryByText(/Ophelia's bench by the fountain is somebody else's tonight/)).not.toBeInTheDocument()
  })
})
