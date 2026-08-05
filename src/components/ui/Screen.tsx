import type { ReactNode } from 'react'

interface EyebrowProps {
  children: ReactNode
  accent?: 'cyan' | 'magenta' | 'amber'
}

const EYEBROW_COLOR = {
  cyan: 'text-cyan-400',
  magenta: 'text-fuchsia-400',
  amber: 'text-amber-400',
}

export function Eyebrow({ children, accent = 'cyan' }: EyebrowProps) {
  return (
    <div
      className={`font-display text-xs font-semibold uppercase tracking-[0.3em] ${EYEBROW_COLOR[accent]}`}
    >
      {children}
    </div>
  )
}

interface TitleProps {
  children: ReactNode
  accent?: 'cyan' | 'magenta' | 'amber'
  className?: string
}

const TITLE_GLOW = {
  cyan: 'text-glow-cyan',
  magenta: 'text-glow-magenta',
  amber: '',
}

export function Title({ children, accent = 'cyan', className = '' }: TitleProps) {
  return (
    <h1
      className={`font-display text-3xl font-bold uppercase tracking-wide text-neutral-50 ${TITLE_GLOW[accent]} ${className}`}
    >
      {children}
    </h1>
  )
}
