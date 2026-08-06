// The left-edge vertical icon rail (UI_VISUAL_STYLE_SPEC §5.3) shared by the
// Overworld and Dialogue/Scene screens. Presentational — callbacks in, no
// store imports; screens wire it to navigationStore/uiStore. Button order
// (Char/Case/Map/Menu) follows the reference screenshot.

export interface NavRailProps {
  onChar?: () => void
  onMap?: () => void
  onCase?: () => void
  onMenu?: () => void
  className?: string
}

export function NavRail({ onChar, onMap, onCase, onMenu, className = '' }: NavRailProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {onChar && <RailButton label="CHAR" title="Character" onClick={onChar} />}
      {onMap && <RailButton label="MAP" title="Overworld" onClick={onMap} />}
      {onCase && <RailButton label="CASE" title="Casefile" onClick={onCase} />}
      {onMenu && <RailButton label="MENU" title="Settings" onClick={onMenu} />}
    </div>
  )
}

function RailButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-14 w-14 items-center justify-center border border-chrome-primary bg-chrome-primary/5 font-display text-[0.65rem] font-bold uppercase tracking-wider text-chrome-primary outline-none transition-all hover:border-chrome-secondary hover:bg-chrome-secondary/15 hover:text-white hover:shadow-[0_0_15px_var(--color-chrome-secondary)] focus:border-chrome-secondary focus:shadow-[0_0_15px_var(--color-chrome-secondary)]"
      style={{
        clipPath:
          'polygon(0 0, calc(100% - var(--cut-sm)) 0, 100% var(--cut-sm), 100% 100%, var(--cut-sm) 100%, 0 calc(100% - var(--cut-sm)))',
      }}
    >
      {label}
    </button>
  )
}
