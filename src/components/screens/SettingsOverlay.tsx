// Settings (UI_DESIGN §6.6). Session-only — no Save/Persistence Layer yet
// (Architecture §5) — and the volume sliders have no audio engine to drive
// yet (§7), same status as every other placeholder-but-real control in
// this pass. Reduce Motion/High Contrast/Large Text are real, wired
// effects (see App.tsx), not decorative checkboxes.

import { useSettingsStore, type TextSpeed } from '../../stores/settingsStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, NeonCheckbox, NeonSlider, Panel } from '../ui'

const TEXT_SPEEDS: TextSpeed[] = ['slow', 'normal', 'fast']

export function SettingsOverlay() {
  const settings = useSettingsStore()
  const closeOverlay = useUiStore((s) => s.closeOverlay)

  return (
    <Panel size="lg" className="flex max-h-[85vh] w-full max-w-3xl flex-col gap-6 p-8" onClick={(e) => e.stopPropagation()}>
      <h1 className="text-center font-display text-2xl font-bold uppercase tracking-widest text-chrome-primary">System Cfg</h1>

      <div className="grid gap-8 overflow-y-auto md:grid-cols-2">
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
      </div>

      <div className="flex justify-center border-t border-white/10 pt-5">
        <CyberButton onClick={closeOverlay}>Close</CyberButton>
      </div>
    </Panel>
  )
}
