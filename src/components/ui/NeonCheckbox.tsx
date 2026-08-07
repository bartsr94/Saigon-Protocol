import { useAudioStore } from '../../stores/audioStore'

export interface NeonCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

/** Cut-sm checkbox with a glowing "X" when checked — Settings overlay toggles. */
export function NeonCheckbox({ label, checked, onChange, className = '' }: NeonCheckboxProps) {
  return (
    <label className={`flex items-center justify-between gap-3 font-body text-base text-white/85 ${className}`}>
      <span>{label}</span>
      <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          checked={checked}
          onChange={(e) => {
            useAudioStore.getState().playSfx(e.target.checked ? 'checkboxOn' : 'checkboxOff')
            onChange(e.target.checked)
          }}
        />
        <span
          className="pointer-events-none flex h-full w-full items-center justify-center border border-chrome-primary/50 bg-chrome-primary/5 font-display text-sm font-black text-transparent transition-all peer-checked:border-chrome-secondary peer-checked:bg-chrome-secondary/15 peer-checked:text-chrome-secondary peer-checked:shadow-[0_0_10px_var(--color-chrome-secondary)]"
          style={{
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          }}
        >
          X
        </span>
      </span>
    </label>
  )
}
