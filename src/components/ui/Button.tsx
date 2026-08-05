import type { ButtonHTMLAttributes, CSSProperties, MouseEvent, ReactNode } from 'react'
import { playSfx, type SfxName } from '../../audio/sfx'
import btnPrimaryNormal from '../../assets/ui/Interactive_Buttons/Primary_Button/Btn_Primary_Normal.png'
import btnPrimaryHover from '../../assets/ui/Interactive_Buttons/Primary_Button/Btn_Primary_Hover.png'
import btnPrimaryPressed from '../../assets/ui/Interactive_Buttons/Primary_Button/Btn_Primary_Pressed.png'
import btnSecondaryNormal from '../../assets/ui/Interactive_Buttons/Secondary_Button/Btn_Secondary_Normal.png'
import btnSecondaryHover from '../../assets/ui/Interactive_Buttons/Secondary_Button/Btn_Secondary_Hover.png'
import btnSecondaryPressed from '../../assets/ui/Interactive_Buttons/Secondary_Button/Btn_Secondary_Pressed.png'
import './uiChrome.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  sound?: SfxName
}

const DEFAULT_SOUND: Record<string, SfxName> = {
  primary: 'select',
  secondary: 'select',
  ghost: 'cancel',
  danger: 'error',
}

const CHROME_ART: Record<string, CSSProperties> = {
  primary: {
    '--chrome-img-normal': `url(${btnPrimaryNormal})`,
    '--chrome-img-hover': `url(${btnPrimaryHover})`,
    '--chrome-img-pressed': `url(${btnPrimaryPressed})`,
  } as CSSProperties,
  secondary: {
    '--chrome-img-normal': `url(${btnSecondaryNormal})`,
    '--chrome-img-hover': `url(${btnSecondaryHover})`,
    '--chrome-img-pressed': `url(${btnSecondaryPressed})`,
  } as CSSProperties,
}

const VARIANTS: Record<string, string> = {
  primary: 'btn-chrome text-cyan-300 text-glow-cyan',
  secondary: 'btn-chrome text-neutral-200',
  ghost: 'text-neutral-500 hover:text-neutral-200',
  danger:
    'bg-fuchsia-500 text-neutral-950 hover:bg-fuchsia-400 shadow-[0_0_20px_-4px_rgba(232,121,249,0.7)]',
}

export function Button({
  children,
  variant = 'primary',
  sound,
  className = '',
  style,
  onClick,
  ...rest
}: ButtonProps) {
  const chromeStyle = CHROME_ART[variant]
  const resolvedSound = sound ?? DEFAULT_SOUND[variant]

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    playSfx(resolvedSound)
    onClick?.(event)
  }

  return (
    <button
      className={`rounded-sm px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider transition-all duration-150 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      style={chromeStyle ? { ...chromeStyle, ...style } : style}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  )
}
