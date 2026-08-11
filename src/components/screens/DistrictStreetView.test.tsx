// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import '../../test/mediaPlaybackStub'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DISTRICT_STREETS } from '../../content/districtStreets'
import { useDebugMapEditStore } from '../../stores/debugMapEditStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { DistrictStreetView } from './DistrictStreetView'

const district4 = DISTRICT_STREETS.district4!

afterEach(() => {
  cleanup()
  useGameplayStore.getState().reset()
  useDebugMapEditStore.setState({ enabled: false })
})

describe('DistrictStreetView — live Map Editor keyboard interaction', () => {
  it('lets w/a/s/d and arrow keys reach an open editor field instead of moving the player behind it', async () => {
    const user = userEvent.setup()
    useDebugMapEditStore.setState({ enabled: true })

    render(<DistrictStreetView street={district4} background={null} onReturnToMap={vi.fn()} atEntry={true} />)

    const positionBefore = useGameplayStore.getState().districtPlayerPosition

    await user.click(screen.getByRole('button', { name: 'Edit Map' }))
    const nameInput = screen.getByPlaceholderText<HTMLInputElement>('name')
    const initialValue = nameInput.value
    await user.click(nameInput)
    await user.keyboard('warehouse{ArrowLeft}{ArrowLeft}')

    expect(nameInput).toHaveValue(`${initialValue}warehouse`)
    expect(useGameplayStore.getState().districtPlayerPosition).toEqual(positionBefore)
  })
})
