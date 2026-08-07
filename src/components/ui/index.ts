// Reusable presentational primitives per docs/GAME_GUIDE.md §3.
// Pure/presentational — props in, no store imports (CLAUDE.md's simulation/
// UI separation rule).

export { Panel } from './Panel'
export type { PanelProps, PanelSize } from './Panel'

export { CyberButton } from './CyberButton'
export type { CyberButtonProps } from './CyberButton'

export { GlitchText } from './GlitchText'
export type { GlitchTextProps } from './GlitchText'

export { PipTrack } from './PipTrack'
export type { PipTrackProps } from './PipTrack'

export { InsightChip } from './InsightChip'
export type { InsightChipProps } from './InsightChip'

export { ChoiceRow } from './ChoiceRow'
export type { ChoiceRowProps, ChoiceTagVariant } from './ChoiceRow'

export { CheckResultBlock } from './CheckResultBlock'
export type { CheckResultBlockProps } from './CheckResultBlock'

export { NeonSlider } from './NeonSlider'
export type { NeonSliderProps } from './NeonSlider'

export { NeonCheckbox } from './NeonCheckbox'
export type { NeonCheckboxProps } from './NeonCheckbox'

export { PortraitFrame } from './PortraitFrame'
export type { PortraitFrameProps, PortraitSize } from './PortraitFrame'
