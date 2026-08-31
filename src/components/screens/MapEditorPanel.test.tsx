// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import '../../test/mediaPlaybackStub'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MapEditorPanel, type BuilderSeed } from './MapEditorPanel'

// This project doesn't enable Vitest's `globals` mode, so @testing-library/react's
// automatic afterEach(cleanup) detection never fires — without this, both tests'
// renders pile up in the same jsdom document and queries start matching stale nodes.
afterEach(() => cleanup())

const SEED: BuilderSeed = {
  id: 'testHub',
  name: 'Test Hub',
  blurb: 'A place.',
  backgroundId: '',
  visionRadius: '',
  grid: [
    ['floor', 'floor'],
    ['floor', 'floor'],
  ],
  pois: [{ id: 'poi-1', x: 0, y: 0, backgroundId: '', interactions: [], locationId: '', label: '', description: '', lockedReason: '' }],
  doors: [{ id: 'door-1', x: 1, y: 0, unlockFlag: '', label: '', lockedReason: '', backgroundId: '' }],
  entryTile: { x: 0, y: 0 },
}

describe('MapEditorPanel', () => {
  it('keeps the POI panel open — and the id field responsive to backspace — while renaming a POI', async () => {
    const user = userEvent.setup()
    render(<MapEditorPanel initialMode="hub" allowModeSwitch={false} initialData={SEED} onSave={vi.fn()} saveLabel="Save" />)

    await user.click(screen.getByRole('button', { name: 'poi-1 (0,0)' }))
    const idInput = screen.getByDisplayValue('poi-1')

    // Renaming is the only way to name a POI in hub mode — backspacing the
    // placeholder id used to desync `selectedPoiId` from the edited record
    // on the very first keystroke, making the whole panel (Delete button,
    // Interactions list) disappear as if the view had exited.
    await user.type(idInput, '{Backspace}warehouse')

    expect(screen.getByDisplayValue('poi-warehouse')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByText('Interactions')).toBeInTheDocument()
  })

  it('keeps the door panel open while renaming a door', async () => {
    const user = userEvent.setup()
    render(<MapEditorPanel initialMode="hub" allowModeSwitch={false} initialData={SEED} onSave={vi.fn()} saveLabel="Save" />)

    await user.click(screen.getByRole('button', { name: 'door-1 (1,0)' }))
    const idInput = screen.getByDisplayValue('door-1')

    await user.type(idInput, '{Backspace}checkpoint')

    expect(screen.getByDisplayValue('door-checkpoint')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('unlockFlag (caseStore flag id)')).toBeInTheDocument()
  })
})
