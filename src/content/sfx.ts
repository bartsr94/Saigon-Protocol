// One-shot UI interaction sounds (docs/GAME_GUIDE.md). Triggered
// directly from component event handlers via audioStore.playSfx(id) — UI
// feedback, not simulation state, so this is plain component-layer wiring,
// same as the voice glyph's replayVoice() call. Mixes into the existing
// `sfx` channel, same as ambience layers.
//
// Two levels, not one: `SfxId` is "what interaction fired," `SfxCategory` is
// "which delivered sound pool serves it" — several ids share a category
// (e.g. checkSuccess reuses the same Confirm pool buttonClick does), and a
// category holds several file variants so playSfx can pick one at random
// per call rather than replaying the exact same clip every time.

export type SfxCategory = 'hover' | 'confirm' | 'close' | 'open' | 'scan'

export type SfxId =
  | 'buttonHover'
  | 'buttonClick'
  | 'choiceSelect'
  | 'checkboxOn'
  | 'checkboxOff'
  | 'sliderTick'
  | 'overlayOpen'
  | 'overlayClose'
  | 'insightInterject'
  | 'checkSuccess'
  | 'checkFailure'

export const SFX_IDS: SfxId[] = [
  'buttonHover',
  'buttonClick',
  'choiceSelect',
  'checkboxOn',
  'checkboxOff',
  'sliderTick',
  'overlayOpen',
  'overlayClose',
  'insightInterject',
  'checkSuccess',
  'checkFailure',
]

/**
 * Which delivered pool each interaction reuses. `confirm`/`close` double up
 * as a loose positive/negative valence pair — checkboxOn and a successful
 * check both read as "confirm," checkboxOff and a failed check both read as
 * "close" — rather than every id needing its own dedicated recording.
 */
export const SFX_ID_TO_CATEGORY: Record<SfxId, SfxCategory> = {
  buttonHover: 'hover',
  sliderTick: 'hover',
  buttonClick: 'confirm',
  choiceSelect: 'confirm',
  checkboxOn: 'confirm',
  checkSuccess: 'confirm',
  checkboxOff: 'close',
  checkFailure: 'close',
  overlayOpen: 'open',
  overlayClose: 'close',
  insightInterject: 'scan',
}

/**
 * On-disk folder per category — deliberately not just the bare category id.
 * Each folder name spells out every SfxId that draws from it (kept in sync
 * with SFX_ID_TO_CATEGORY by convention, not by code — rename the folder
 * alongside the map if the mapping ever changes), so `public/audio/sfx/` is
 * self-documenting when browsing it directly: swapping a pack means finding
 * the folder that names the interaction you want to change and dropping in
 * replacement `ui-<category>-<n>.mp3` files.
 */
const SFX_CATEGORY_FOLDER: Record<SfxCategory, string> = {
  hover: 'hover--button-hover+slider-tick',
  confirm: 'confirm--button-click+choice-select+checkbox-on+check-success',
  close: 'close--checkbox-off+check-failure+overlay-close',
  open: 'open--overlay-open',
  scan: 'scan--insight-interject',
}

function variants(category: SfxCategory, count: number): string[] {
  const folder = SFX_CATEGORY_FOLDER[category]
  return Array.from({ length: count }, (_, i) => `/audio/sfx/${folder}/ui-${category}-${i + 1}.mp3`)
}

/** `/audio/sfx/<category-folder>/ui-<category>-<n>.mp3` — served from public/, not looped. */
export const SFX_CATEGORY_VARIANTS: Record<SfxCategory, string[]> = {
  hover: variants('hover', 9),
  confirm: variants('confirm', 9),
  close: variants('close', 9),
  open: variants('open', 9),
  scan: variants('scan', 8),
}

/**
 * Pins a specific interaction to one exact variant instead of a random pick
 * from its category pool — checked before SFX_ID_TO_CATEGORY/
 * SFX_CATEGORY_VARIANTS in audioStore.playSfx. A preference call, not a
 * pool-size constraint: buttonClick's confirm pool still has 9 variants,
 * ui-confirm-6 is just the one that's been chosen for it specifically.
 */
export const SFX_ID_OVERRIDE: Partial<Record<SfxId, string>> = {
  buttonClick: `/audio/sfx/${SFX_CATEGORY_FOLDER.confirm}/ui-confirm-6.mp3`,
}
