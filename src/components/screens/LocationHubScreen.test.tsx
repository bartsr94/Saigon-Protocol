// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import '../../test/mediaPlaybackStub'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { useConversationStore } from '../../stores/conversationStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useInsightStore } from '../../stores/insightStore'
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
