import type { ReactNode } from 'react'
import { useAudioStore } from '../../stores/audioStore'

interface GameFrameProps {
  children: ReactNode
  className?: string
}

function SoundIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M4 9v6h4l5 5V4L8 9H4Z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8 8 0 0 1 0 12" />
    </svg>
  )
}

function MutedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M4 9v6h4l5 5V4L8 9H4Z" />
      <path d="M16 9l5 5M21 9l-5 5" />
    </svg>
  )
}

export function GameFrame({ children, className = '' }: GameFrameProps) {
  const muted = useAudioStore((state) => state.muted)
  const toggleMuted = useAudioStore((state) => state.toggleMuted)

  return (
    <div className="relative min-h-svh overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.10),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(232,121,249,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />

      <button
        onClick={toggleMuted}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        aria-pressed={muted}
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/60 text-neutral-500 transition-colors hover:border-cyan-400/60 hover:text-cyan-300"
      >
        {muted ? <MutedIcon /> : <SoundIcon />}
      </button>

      <div className={`relative p-6 sm:p-10 ${className}`}>{children}</div>
    </div>
  )
}
