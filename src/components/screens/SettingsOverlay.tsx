// Settings (docs/GAME_GUIDE.md §2, §7) — also serves as the pause/system
// menu, there's no separate Pause screen. The Save_Data section implements
// the save/load slot UX; audio/accessibility settings themselves stay
// deliberately session-only, never part of a save blob. Volume sliders
// drive the real audioStore (docs/GAME_GUIDE.md §8), which subscribes to
// this store directly — no wiring needed here beyond the sliders
// themselves. Reduce Motion/High Contrast/Large Text are real, wired
// effects (see App.tsx), not decorative checkboxes.

import { useEffect, useState } from 'react'
import { useSettingsStore, type TextSpeed } from '../../stores/settingsStore'
import { useSaveStore } from '../../stores/saveStore'
import { useUiStore } from '../../stores/uiStore'
import { useStoryStore } from '../../stores/storyStore'
import { useAudioStore } from '../../stores/audioStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { LOCATIONS } from '../../content/locations'
import { CyberButton, NeonCheckbox, NeonSlider, PageControls, Panel, usePagination } from '../ui'

const TEXT_SPEEDS: TextSpeed[] = ['slow', 'normal', 'fast']
// Save slots are paginated instead of scrolling (UI_PASS_SPEC.md §2) — the
// only genuinely unbounded list in this overlay (Audio/Visual sections are
// fixed-size).
const SAVE_SLOTS_PAGE_SIZE = 3

function formatSavedAt(savedAt: number): string {
  return new Date(savedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SaveDataSection() {
  const screen = useUiStore((s) => s.screen)
  const closeOverlay = useUiStore((s) => s.closeOverlay)
  const goToGame = useUiStore((s) => s.goToGame)
  const slots = useSaveStore((s) => s.slots)
  const refreshSlots = useSaveStore((s) => s.refreshSlots)
  const saveToSlot = useSaveStore((s) => s.saveToSlot)
  const loadSlot = useSaveStore((s) => s.loadSlot)
  const deleteSlot = useSaveStore((s) => s.deleteSlot)
  const [newSaveName, setNewSaveName] = useState('')
  const slotsPage = usePagination(slots, SAVE_SLOTS_PAGE_SIZE)

  useEffect(() => {
    refreshSlots()
    // Refresh once when the overlay opens — the store's own actions already
    // keep `slots` current for the rest of this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLoad(id: string) {
    if (!loadSlot(id)) return
    // Same title-music handoff TitleScreen's Continue needs (docs/GAME_GUIDE.md).
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

  function handleSaveNew() {
    const name = newSaveName.trim()
    if (!name) return
    saveToSlot(name)
    setNewSaveName('')
  }

  return (
    <section className="flex flex-col gap-4 border border-white/10 bg-white/5 p-5 md:col-span-2">
      <h2 className="border-b border-chrome-secondary/30 pb-2 font-display text-sm uppercase tracking-widest text-chrome-secondary">
        Save_Data
      </h2>

      {screen === 'game' && (
        <div className="flex items-end gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="font-display text-xs font-bold uppercase tracking-widest text-white/60">New Save Name</span>
            <input
              type="text"
              value={newSaveName}
              onChange={(e) => setNewSaveName(e.target.value)}
              placeholder="e.g. Before the checkpoint"
              maxLength={60}
              className="border border-white/20 bg-black/50 px-3 py-2 font-body text-sm text-white outline-none focus:border-chrome-secondary"
            />
          </label>
          <CyberButton onClick={handleSaveNew} disabled={newSaveName.trim().length === 0}>
            Save New
          </CyberButton>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {slots.length === 0 && <p className="font-body text-sm text-white/40">No saves yet.</p>}
        {slotsPage.pageItems.map((slot) => (
          <div key={slot.id} className="flex items-center justify-between gap-3 border border-white/10 bg-black/30 px-3 py-2">
            <div className="min-w-0">
              <div className="font-display text-xs font-bold uppercase tracking-wide text-white">
                {slot.name}
                {slot.kind === 'autosave' && <span className="ml-2 text-chrome-primary">(auto)</span>}
              </div>
              <div className="truncate font-body text-xs text-white/50">
                {formatSavedAt(slot.savedAt)} · {slot.playerName || slot.archetypeName} · {slot.locationName ?? 'Overworld'}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => handleLoad(slot.id)}>
                Load
              </CyberButton>
              {slot.kind === 'manual' && screen === 'game' && (
                <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => saveToSlot(slot.name, slot.id)}>
                  Overwrite
                </CyberButton>
              )}
              <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => deleteSlot(slot.id)}>
                Delete
              </CyberButton>
            </div>
          </div>
        ))}
      </div>
      <PageControls page={slotsPage.page} pageCount={slotsPage.pageCount} onChange={slotsPage.setPage} />
    </section>
  )
}

export function SettingsOverlay() {
  const settings = useSettingsStore()
  const closeOverlay = useUiStore((s) => s.closeOverlay)

  return (
    <Panel size="lg" className="flex w-full max-w-3xl flex-col gap-6 p-8" onClick={(e) => e.stopPropagation()}>
      <h1 className="text-center font-display text-2xl font-bold uppercase tracking-widest text-chrome-primary">System Cfg</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="flex flex-col gap-5 border border-white/10 bg-white/5 p-5">
          <h2 className="border-b border-chrome-secondary/30 pb-2 font-display text-sm uppercase tracking-widest text-chrome-secondary">
            Audio_Matrix
          </h2>
          <NeonSlider
            label="Master Volume"
            value={settings.masterVolume}
            onChange={(v) => settings.setVolume('master', v)}
            formatValue={(v) => `${v}%`}
          />
          <NeonSlider
            label="SFX Output"
            value={settings.sfxVolume}
            onChange={(v) => settings.setVolume('sfx', v)}
            formatValue={(v) => `${v}%`}
          />
          <NeonSlider
            label="Music"
            value={settings.musicVolume}
            onChange={(v) => settings.setVolume('music', v)}
            formatValue={(v) => `${v}%`}
          />
          <NeonSlider
            label="Voice"
            value={settings.voiceVolume}
            onChange={(v) => settings.setVolume('voice', v)}
            formatValue={(v) => `${v}%`}
          />
          <NeonCheckbox label="Voice Lines Enabled" checked={settings.voiceEnabled} onChange={settings.setVoiceEnabled} />
        </section>

        <section className="flex flex-col gap-5 border border-white/10 bg-white/5 p-5">
          <h2 className="border-b border-chrome-secondary/30 pb-2 font-display text-sm uppercase tracking-widest text-chrome-secondary">
            Visual_&amp;_Accessibility
          </h2>
          <NeonSlider
            label="Text Speed"
            value={TEXT_SPEEDS.indexOf(settings.textSpeed)}
            min={0}
            max={2}
            onChange={(v) => settings.setTextSpeed(TEXT_SPEEDS[v])}
            formatValue={(v) => TEXT_SPEEDS[v].toUpperCase()}
          />
          <NeonCheckbox label="Instant Text" checked={settings.instantText} onChange={settings.setInstantText} />
          <NeonCheckbox label="Reduce Motion" checked={settings.reduceMotion} onChange={settings.setReduceMotion} />
          <NeonCheckbox label="High Contrast" checked={settings.highContrast} onChange={settings.setHighContrast} />
          <NeonCheckbox label="Large Text" checked={settings.largeText} onChange={settings.setLargeText} />
        </section>

        <SaveDataSection />
      </div>

      <div className="flex justify-center border-t border-white/10 pt-5">
        <CyberButton onClick={closeOverlay}>Close</CyberButton>
      </div>
    </Panel>
  )
}
