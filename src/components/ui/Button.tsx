import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

const VARIANTS: Record<string, string> = {
  primary:
    'bg-cyan-400 text-neutral-950 hover:bg-cyan-300 shadow-[0_0_20px_-4px_rgba(34,211,238,0.7)]',
  secondary:
    'border border-neutral-700 bg-neutral-900/60 text-neutral-200 hover:border-cyan-400/60 hover:text-cyan-300',
  ghost: 'text-neutral-500 hover:text-neutral-200',
  danger:
    'bg-fuchsia-500 text-neutral-950 hover:bg-fuchsia-400 shadow-[0_0_20px_-4px_rgba(232,121,249,0.7)]',
}

export function Button({ children, variant = 'primary', className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`rounded-sm px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider transition-all duration-150 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
