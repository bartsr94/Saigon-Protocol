import { useAudioStore } from '../../stores/audioStore'

export interface NeonSliderProps {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  /** Formats the value shown next to the label, e.g. `(v) => \`${v}%\``. */
  formatValue?: (value: number) => string
  className?: string
}

/**
 * Cyan track / magenta thumb range input — Settings overlay sliders
 * (UI_VISUAL_STYLE_SPEC §5.6). The thumb chrome lives in index.css's
 * `.neon-slider` rules since range-input pseudo-elements can't be styled
 * from an inline style prop.
 */
export function NeonSlider({ label, value, min = 0, max = 100, onChange, formatValue, className = '' }: NeonSliderProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between font-body text-base text-white/85">
        <label>{label}</label>
        <span className="font-display text-sm font-bold text-chrome-primary">{formatValue ? formatValue(value) : value}</span>
      </div>
      <input
        type="range"
        className="neon-slider"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value)
          // Native range inputs only fire onChange when the quantized value
          // actually moves, so this is already "per notch," not per pixel.
          if (next !== value) useAudioStore.getState().playSfx('sliderTick')
          onChange(next)
        }}
      />
    </div>
  )
}
