import { useEffect, useState } from 'react'

export interface GlitchTextProps {
  text: string
  /**
   * Continuous glitch loop. Reserved for the title/logo screen — never body
   * text or anything read for more than a second (docs/GAME_GUIDE.md §3.4).
   */
  loop?: boolean
  className?: string
  as?: 'span' | 'h1' | 'div'
}

/**
 * One-shot glitch flicker by default (settles after ~650ms), continuous
 * only when `loop` is set. Disabled automatically under
 * prefers-reduced-motion via the CSS in index.css.
 */
export function GlitchText({ text, loop = false, className = '', as = 'span' }: GlitchTextProps) {
  const [active, setActive] = useState(loop)

  useEffect(() => {
    if (loop) return
    setActive(true)
    const timeout = setTimeout(() => setActive(false), 650)
    return () => clearTimeout(timeout)
  }, [loop, text])

  const Tag = as
  return (
    <Tag className={`glitch-text ${active ? 'glitch-text--active' : ''} ${className}`} data-text={text}>
      {text}
    </Tag>
  )
}
