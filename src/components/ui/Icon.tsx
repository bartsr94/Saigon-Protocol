import { ICONS, type IconId } from '../../content/icons'

export interface IconProps {
  id: IconId
  size?: number
  /** Any CSS color, including this project's `var(--color-chrome-*)` tokens. */
  color?: string
  /** Adds a `drop-shadow` glow in `color`, matching the neon-glow treatment other HUD elements use. */
  glow?: boolean
  className?: string
}

/**
 * Renders a public/icons/*.png (white silhouette on transparent) as a CSS
 * mask rather than an <img>, so any icon can be tinted to match the accent
 * color at its call site instead of shipping separately-colored art per use.
 */
export function Icon({ id, size = 16, color = 'currentColor', glow = false, className = '' }: IconProps) {
  const { src } = ICONS[id]
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        filter: glow ? `drop-shadow(0 0 6px ${color})` : undefined,
      }}
    />
  )
}
