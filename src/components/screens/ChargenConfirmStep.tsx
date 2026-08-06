// Character Creation step 3: confirm/backstory + name entry (UI_DESIGN
// §6.2 step 3), then into the opening scene.

import { ARCHETYPES } from '../../content/archetypes'
import { useInsightStore } from '../../stores/insightStore'
import { CyberButton, Panel, PortraitFrame } from '../ui'

export interface ChargenConfirmStepProps {
  onBack: () => void
  onConfirm: () => void
}

function initials(name: string): string {
  return name.replace('The ', '').slice(0, 2).toUpperCase()
}

export function ChargenConfirmStep({ onBack, onConfirm }: ChargenConfirmStepProps) {
  const archetype = useInsightStore((s) => s.archetype)
  const playerName = useInsightStore((s) => s.playerName)
  const setPlayerName = useInsightStore((s) => s.setPlayerName)

  if (!archetype) return null
  const def = ARCHETYPES[archetype]

  return (
    <div className="flex flex-col gap-5">
      <Panel size="sm" className="flex gap-5 p-6">
        <PortraitFrame src={def.portraitSrc} alt={def.name} fallbackText={initials(def.name)} size="lg" />
        <div className="flex flex-col gap-2">
          <span className="font-display text-lg font-bold uppercase tracking-wide text-white">{def.name}</span>
          <p className="font-body text-sm text-white/60">{def.backstory}</p>
        </div>
      </Panel>

      <label className="flex flex-col gap-2">
        <span className="font-display text-xs font-bold uppercase tracking-widest text-chrome-secondary">Detective&apos;s Name</span>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter a name"
          maxLength={40}
          className="border border-white/20 bg-black/50 px-3 py-2 font-body text-sm text-white outline-none focus:border-chrome-secondary"
        />
      </label>

      <div className="flex justify-between pt-2">
        <CyberButton onClick={onBack}>Back</CyberButton>
        <CyberButton onClick={onConfirm} disabled={playerName.trim().length === 0} tag="GO">
          Begin
        </CyberButton>
      </div>
    </div>
  )
}
