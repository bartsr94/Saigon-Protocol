// The left-edge vertical icon rail (docs/GAME_GUIDE.md §2.1) shared by the
// Overworld and Dialogue/Scene screens. Presentational — callbacks in, no
// navigation/simulation-state store imports; screens wire it to
// navigationStore/uiStore. Button order (Char/Case/Map/Menu) follows the
// reference screenshot. The one exception is audioStore, for the same
// hover/click SFX every other button gets (docs/GAME_GUIDE.md) —
// UI feedback, not a coupling to game state.

import { useAudioStore } from '../../stores/audioStore'

export interface NavRailProps {
  onChar?: () => void
  onMap?: () => void
  onCase?: () => void
  onThoughts?: () => void
  onMenu?: () => void
  className?: string
  /** Blocks the MAP button without hiding it — e.g. a walkable hub/street requires standing on its entry tile before returning. */
  mapDisabled?: boolean
  /** Tooltip shown while `mapDisabled` — explains why MAP won't respond. */
  mapTitle?: string
  /** Disables every button in the rail — e.g. while a full-screen dev Map Editor modal is open, so its overlay can't stack with another one behind it (UI_PASS_SPEC.md §3). */
  disabled?: boolean
}

export function NavRail({
  onChar,
  onMap,
  onCase,
  onThoughts,
  onMenu,
  className = '',
  mapDisabled = false,
  mapTitle,
  disabled = false,
}: NavRailProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {onChar && <RailButton label="CHAR" title="Character" onClick={onChar} disabled={disabled} />}
      {onMap && (
        <RailButton
          label="MAP"
          title={mapDisabled ? mapTitle ?? 'Overworld' : 'Overworld'}
          onClick={onMap}
          disabled={disabled || mapDisabled}
        />
      )}
      {onCase && <RailButton label="CASES" title="Cases" onClick={onCase} disabled={disabled} />}
      {onThoughts && <RailButton label="MIND" title="Thought Cabinet" onClick={onThoughts} disabled={disabled} />}
      {onMenu && <RailButton label="MENU" title="Settings" onClick={onMenu} disabled={disabled} />}
    </div>
  )
}

function RailButton({ label, title, onClick, disabled = false }: { label: string; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseEnter={() => !disabled && useAudioStore.getState().playSfx('buttonHover')}
      onClick={() => {
        if (disabled) return
        useAudioStore.getState().playSfx('buttonClick')
        onClick()
      }}
      className={`flex h-14 w-14 items-center justify-center border font-display text-[0.65rem] font-bold uppercase tracking-wider outline-none transition-all ${
        disabled
          ? 'cursor-not-allowed border-white/20 bg-transparent text-white/20'
          : 'cursor-pointer border-chrome-primary bg-chrome-primary/5 text-chrome-primary hover:border-chrome-secondary hover:bg-chrome-secondary/15 hover:text-white hover:shadow-[0_0_15px_var(--color-chrome-secondary)] focus:border-chrome-secondary focus:shadow-[0_0_15px_var(--color-chrome-secondary)]'
      }`}
      style={{
        clipPath:
          'polygon(0 0, calc(100% - var(--cut-sm)) 0, 100% var(--cut-sm), 100% 100%, var(--cut-sm) 100%, 0 calc(100% - var(--cut-sm)))',
      }}
    >
      {label}
    </button>
  )
}
