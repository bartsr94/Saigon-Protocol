import type { ReactNode } from 'react'

interface GameFrameProps {
  children: ReactNode
  className?: string
}

export function GameFrame({ children, className = '' }: GameFrameProps) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.10),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(232,121,249,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />
      <div className={`relative p-6 sm:p-10 ${className}`}>{children}</div>
    </div>
  )
}
