// Icon registry (docs/GAME_GUIDE.md §3 visual style). Source art in
// public/icons/ is a 50-icon white-silhouette-on-transparent set; only the
// ones actually wired into a screen get a sensible id/filename here — the
// rest stay as their original numbered files until something needs them.
// Same shape as content/backgrounds.ts: plain src path served from public/,
// tinted at render time via ui/Icon.tsx's mask-image technique rather than
// shipping pre-colored art.

export type IconId = 'poiMarker' | 'door' | 'leadAlert'

export const ICON_IDS: IconId[] = ['poiMarker', 'door', 'leadAlert']

export interface IconDefinition {
  id: IconId
  /** `/icons/<file>` — served from public/. */
  src: string
}

export const ICONS: Record<IconId, IconDefinition> = {
  poiMarker: { id: 'poiMarker', src: '/icons/poi-marker.png' },
  door: { id: 'door', src: '/icons/door.png' },
  leadAlert: { id: 'leadAlert', src: '/icons/lead-alert.png' },
}
