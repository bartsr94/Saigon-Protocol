import type { ButtonHTMLAttributes } from 'react'

export interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional decorative corner tag, e.g. "SYS.01" (Title/Boot buttons). */
  tag?: string
}

/**
 * Cut-md chrome button — idle cyan, hover/focus magenta (UI_VISUAL_STYLE_SPEC
 * §1/§3). Used for nav-rail icons, menu buttons, Settings actions.
 */
export function CyberButton({ tag, className = '', children, disabled, ...props }: CyberButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`group relative flex items-center justify-between gap-3 border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest outline-none transition-all duration-300 ${
        disabled
          ? 'cursor-not-allowed border-white/20 bg-transparent text-white/20'
          : 'cursor-pointer border-chrome-primary bg-chrome-primary/5 text-chrome-primary hover:border-chrome-secondary hover:bg-chrome-secondary/15 hover:text-white hover:shadow-[0_0_20px_var(--color-chrome-secondary)] focus:border-chrome-secondary focus:bg-chrome-secondary/15 focus:text-white focus:shadow-[0_0_20px_var(--color-chrome-secondary)]'
      } ${className}`}
      style={{
        clipPath:
          'polygon(0 0, calc(100% - var(--cut-md)) 0, 100% var(--cut-md), 100% 100%, var(--cut-md) 100%, 0 calc(100% - var(--cut-md)))',
      }}
    >
      <span>{children}</span>
      {tag && (
        <span className="text-xs font-medium tracking-wider opacity-60 group-hover:text-chrome-secondary group-hover:opacity-100">
          {tag}
        </span>
      )}
    </button>
  )
}
