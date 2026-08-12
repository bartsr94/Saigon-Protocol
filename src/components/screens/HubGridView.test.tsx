// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import '../../test/mediaPlaybackStub'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOCATION_HUBS, type GridHubDefinition } from '../../content/locationHubs'
import { useDebugMapEditStore } from '../../stores/debugMapEditStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { HubGridView } from './HubGridView'

const checkpoint = LOCATION_HUBS.checkpoint as GridHubDefinition

afterEach(() => {
  cleanup()
  useGameplayStore.getState().reset()
  useDebugMapEditStore.setState({ enabled: false })
})

describe('HubGridView — live Map Editor keyboard interaction', () => {
  it('lets w/a/s/d and arrow keys reach an open editor field instead of moving the player behind it', async () => {
    const user = userEvent.setup()
    useDebugMapEditStore.setState({ enabled: true })

    render(<HubGridView hub={checkpoint} background={null} onEnterInteraction={vi.fn()} onReturnToMap={vi.fn()} atEntry={true} />)

    const positionBefore = useGameplayStore.getState().playerPosition

    await user.click(screen.getByRole('button', { name: 'Edit Map' }))
    const nameInput = screen.getByPlaceholderText<HTMLInputElement>('name')
    const initialValue = nameInput.value
    await user.click(nameInput)
    await user.keyboard('warehouse{ArrowLeft}{ArrowLeft}')

    // Every character (including the movement-key letters) reached the
    // field, and the arrow keys moved the text cursor rather than the
    // player's tile — none of it leaked to the grid's global keydown
    // listener while the editor panel was open.
    expect(nameInput).toHaveValue(`${initialValue}warehouse`)
    expect(useGameplayStore.getState().playerPosition).toEqual(positionBefore)
  })
})
