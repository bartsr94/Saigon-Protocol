import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface CardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  selected?: boolean
  accent?: 'cyan' | 'magenta' | 'amber'
}

const ACCENT: Record<string, { border: string; glow: string; hover: string }> = {
  cyan: {
    border: 'border-cyan-400/70',
    glow: 'shadow-[0_0_24px_-6px_rgba(34,211,238,0.6)]',
    hover: 'hover:border-cyan-500/50 hover:shadow-[0_0_18px_-8px_rgba(34,211,238,0.5)]',
  },
  magenta: {
    border: 'border-fuchsia-400/70',
    glow: 'shadow-[0_0_24px_-6px_rgba(232,121,249,0.6)]',
    hover: 'hover:border-fuchsia-500/50 hover:shadow-[0_0_18px_-8px_rgba(232,121,249,0.5)]',
  },
  amber: {
    border: 'border-amber-400/70',
    glow: 'shadow-[0_0_24px_-6px_rgba(251,191,36,0.6)]',
    hover: 'hover:border-amber-500/50 hover:shadow-[0_0_18px_-8px_rgba(251,191,36,0.5)]',
  },
}

export function CardButton({
  children,
  selected = false,
  accent = 'cyan',
  className = '',
  disabled,
  ...rest
}: CardButtonProps) {
  const a = ACCENT[accent]
  return (
    <button
      disabled={disabled}
      className={`text-left rounded-md border bg-neutral-900/60 p-4 backdrop-blur-sm transition-all duration-150 ${
        disabled
          ? 'border-neutral-800/60 opacity-40 cursor-not-allowed'
          : selected
            ? `${a.border} ${a.glow} bg-neutral-900`
            : `border-neutral-800 ${a.hover}`
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
