import type { ReactNode } from 'react'
import type { ChoiceTagVariant } from '../../engine/contentTags'
import { useAudioStore } from '../../stores/audioStore'

export type { ChoiceTagVariant }

export interface ChoiceRowProps {
  children: ReactNode
  tagVariant?: ChoiceTagVariant
  /** Insight name (insight-gated) or requirement text (locked), e.g. "GRAFT 4 required". */
  tagLabel?: string
  /** Required for tagVariant="insight-gated" — the Insight's own color. */
  insightColor?: string
  onClick?: () => void
  className?: string
}

const TAG_STYLE: Record<Exclude<ChoiceTagVariant, 'none'>, (label: string | undefined, insightColor: string | undefined) => { color: string; text: string }> = {
  'insight-gated': (label, insightColor) => ({ color: insightColor ?? 'var(--color-chrome-primary)', text: label ?? '' }),
  'white-check': (label) => ({ color: 'var(--color-check-white)', text: label ? `${label} ◇` : '◇' }),
  'red-check': (label) => ({ color: 'var(--color-check-red)', text: label ? `${label} ◆ RED` : '◆ RED' }),
  locked: (label) => ({ color: 'rgba(255,255,255,0.45)', text: label ?? 'LOCKED' }),
}

/**
 * One row in the choice list, tagged per UI_DESIGN §5's mechanical
 * vocabulary. Locked-visible choices render greyed out with their
 * requirement labelled, never hidden (that decision is content-side).
 */
export function ChoiceRow({ children, tagVariant = 'none', tagLabel, insightColor, onClick, className = '' }: ChoiceRowProps) {
  const locked = tagVariant === 'locked'
  const tag = tagVariant !== 'none' ? TAG_STYLE[tagVariant](tagLabel, insightColor) : null

  return (
    <button
      onClick={() => {
        useAudioStore.getState().playSfx('choiceSelect')
        onClick?.()
      }}
      disabled={locked}
      className={`group flex w-full items-start gap-3 px-3 py-2 text-left font-body text-[19px] transition-transform duration-200 ${
        locked ? 'cursor-not-allowed text-white/30' : 'cursor-pointer text-white hover:translate-x-1 hover:text-chrome-secondary'
      } ${className}`}
    >
      <span className={`mt-0.5 shrink-0 font-display text-sm ${locked ? 'text-white/30' : 'text-chrome-primary group-hover:text-chrome-secondary'}`}>
        {locked ? '\u{1F512}' : '▸'}
      </span>
      <span className="flex-1">
        {tag && (
          <span
            className="mr-2 inline-block border px-1.5 py-0.5 align-middle font-display text-[0.65rem] font-bold uppercase tracking-wider"
            style={{ color: tag.color, borderColor: tag.color }}
          >
            {tag.text}
          </span>
        )}
        {children}
      </span>
    </button>
  )
}
