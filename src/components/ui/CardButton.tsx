import type { ButtonHTMLAttributes, CSSProperties, MouseEvent, ReactNode } from 'react'
import { playSfx } from '../../audio/sfx'
import btnPrimaryHover from '../../assets/ui/Interactive_Buttons/Primary_Button/Btn_Primary_Hover.png'
import btnSecondaryNormal from '../../assets/ui/Interactive_Buttons/Secondary_Button/Btn_Secondary_Normal.png'
import btnSecondaryHover from '../../assets/ui/Interactive_Buttons/Secondary_Button/Btn_Secondary_Hover.png'
import './uiChrome.css'

interface CardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  selected?: boolean
  accent?: 'cyan' | 'magenta' | 'amber'
}

// The source art is a single cyan neon design; other accents are approximated
// by hue-rotating it rather than shipping separate art per color.
const ACCENT_FILTER: Record<string, string> = {
  cyan: 'none',
  magenta: 'hue-rotate(120deg) saturate(1.3)',
  amber: 'hue-rotate(-140deg) saturate(1.4)',
}

export function CardButton({
  children,
  selected = false,
  accent = 'cyan',
  className = '',
  disabled,
  style,
  onClick,
  onMouseEnter,
  ...rest
}: CardButtonProps) {
  const chromeStyle: CSSProperties = {
    '--chrome-img-normal': `url(${selected ? btnPrimaryHover : btnSecondaryNormal})`,
    '--chrome-img-hover': `url(${btnSecondaryHover})`,
    filter: disabled ? undefined : ACCENT_FILTER[accent],
    ...style,
  } as CSSProperties

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!disabled) playSfx('select')
    onClick?.(event)
  }

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    if (!disabled) playSfx('cursor')
    onMouseEnter?.(event)
  }

  return (
    <button
      disabled={disabled}
      className={`card-chrome text-left transition-all duration-150 ${
        disabled ? 'opacity-40 cursor-not-allowed' : selected ? 'card-chrome--selected' : ''
      } ${className}`}
      style={chromeStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...rest}
    >
      {children}
    </button>
  )
}
