import type { HTMLAttributes, ReactNode } from 'react'

export type PanelSize = 'sm' | 'md' | 'lg'

const CUT_VAR: Record<PanelSize, string> = {
  sm: 'var(--cut-sm)',
  md: 'var(--cut-md)',
  lg: 'var(--cut-lg)',
}

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style' | 'children'> {
  size?: PanelSize
  /** Border/glow color — any CSS color value. Defaults to idle chrome (cyan). */
  accent?: string
  className?: string
  children?: ReactNode
}

/**
 * The cut-corner card chrome shared by every panel in the game — dialogue
 * log, HUD frames, overlay modals, check-result rows (docs/GAME_GUIDE.md
 * §3.3). Purely presentational: callers own layout/content, this only owns
 * the angular border/glow/blur treatment. Forwards ordinary div props
 * (onClick, etc.) — style/className stay Panel's own.
 */
export function Panel({ size = 'md', accent = 'var(--color-chrome-primary)', className = '', children, ...rest }: PanelProps) {
  const cut = CUT_VAR[size]
  return (
    <div
      {...rest}
      className={`relative bg-black/75 backdrop-blur-md ${className}`}
      style={{
        clipPath: `polygon(${cut} 0, 100% 0, 100% calc(100% - ${cut}), calc(100% - ${cut}) 100%, 0 100%, 0 ${cut})`,
        border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
        boxShadow: `inset 0 0 20px color-mix(in srgb, ${accent} 20%, transparent), 0 0 20px color-mix(in srgb, ${accent} 12%, transparent)`,
      }}
    >
      {children}
    </div>
  )
}
