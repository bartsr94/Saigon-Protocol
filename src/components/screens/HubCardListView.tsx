// Legacy card-grid Location Hub presentation (Architecture §7's Location
// Hub Layer), used for hubs that haven't earned a walkable grid yet
// (GAME_GUIDE.md §6.2). Extracted unchanged from LocationHubScreen.tsx's
// original body.

import { useMemo } from 'react'
import type { BackgroundDefinition } from '../../content/backgrounds'
import type { CardListHubDefinition, HubActionDefinition, HubCharacterPresence } from '../../content/locationHubs'
import { NPCS } from '../../content/npcs'
import type { LocationId } from '../../content/locations'
import { CyberButton, PageControls, Panel, PortraitFrame, usePagination } from '../ui'
import { EditableText } from '../debug/EditableText'

interface HubCardListViewProps {
  hub: CardListHubDefinition
  background: BackgroundDefinition | null
  onEnterStory: (id: LocationId) => void
  onReturnToMap: () => void
}

type CardEntry =
  | { kind: 'character'; presence: HubCharacterPresence; available: boolean }
  | { kind: 'action'; action: HubActionDefinition; available: boolean }

// The grid and the sidebar "Current Leads" list both render the same
// entries — paginated together instead of scrolling (UI_PASS_SPEC.md §2)
// so a hub with many talk/inspect entries stays on-screen instead of being
// silently clipped by this screen's overflow-hidden backdrop wrapper.
const ENTRIES_PAGE_SIZE = 6

export function HubCardListView({ hub, background, onEnterStory, onReturnToMap }: HubCardListViewProps) {
  const groupedInteractions = useMemo(
    () => ({
      talk: hub.characters,
      inspect: hub.actions,
    }),
    [hub],
  )

  const availableCharacters = groupedInteractions.talk.filter((presence) => presence.available)
  const unavailableCharacters = groupedInteractions.talk.filter((presence) => !presence.available)
  const availableActions = groupedInteractions.inspect.filter((action) => action.available)
  const unavailableActions = groupedInteractions.inspect.filter((action) => !action.available)

  const entries: CardEntry[] = useMemo(
    () => [
      ...availableCharacters.map((presence): CardEntry => ({ kind: 'character', presence, available: true })),
      ...availableActions.map((action): CardEntry => ({ kind: 'action', action, available: true })),
      ...unavailableCharacters.map((presence): CardEntry => ({ kind: 'character', presence, available: false })),
      ...unavailableActions.map((action): CardEntry => ({ kind: 'action', action, available: false })),
    ],
    [availableCharacters, availableActions, unavailableCharacters, unavailableActions],
  )
  const entriesPage = usePagination(entries, ENTRIES_PAGE_SIZE)

  return (
    <div className="relative flex-1 overflow-hidden">
      {background?.imageSrc && (
        <>
          <img src={background.imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}
      {!background?.imageSrc && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, color-mix(in srgb, var(--color-chrome-primary) 12%, transparent), transparent 35%), linear-gradient(180deg, rgba(2, 5, 8, 0.7), rgba(5, 5, 5, 0.96))',
          }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col justify-between p-6">
        <div className="max-w-xl space-y-3">
          <Panel size="md" className="inline-flex max-w-full flex-col gap-2 p-4">
            <span className="font-display text-[11px] uppercase tracking-[0.35em] text-chrome-primary/70">Location Hub</span>
            <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-white">{hub.name}</h1>
            <EditableText className="font-body text-base leading-6 text-white/72" value={hub.blurb} file="locationHubs" field="blurb" />
          </Panel>
        </div>

        {/* "Who's here" band — a flex row, not per-character anchor
            coordinates, so authored characters can never be placed close
            enough to overlap each other or the panels above/below
            (UI_PASS_SPEC.md §3; this used to be raw `anchor.x/y` percentage
            placement with nothing enforcing spacing). */}
        {groupedInteractions.talk.length > 0 && (
          <div className="hidden flex-wrap items-start justify-center gap-4 xl:flex">
            {groupedInteractions.talk.map((presence) => {
              const npc = NPCS[presence.npcId]
              return (
                <button
                  key={`${presence.label}-anchor`}
                  type="button"
                  disabled={!presence.available}
                  onClick={() => presence.available && onEnterStory(presence.storyLocationId)}
                  className={`w-52 text-left transition-transform ${
                    presence.available ? 'cursor-pointer hover:scale-[1.03]' : 'cursor-not-allowed opacity-70'
                  }`}
                >
                  <Panel
                    size="sm"
                    accent={presence.available ? 'var(--color-chrome-primary)' : 'rgba(255,255,255,0.2)'}
                    className="p-3 backdrop-blur-lg"
                  >
                    <div className="flex items-start gap-3">
                      <PortraitFrame
                        src={npc.portraits?.neutral}
                        alt={npc.name}
                        fallbackText={npc.name.slice(0, 2).toUpperCase()}
                        size="sm"
                        accent={presence.available ? 'var(--color-chrome-primary)' : 'rgba(255,255,255,0.45)'}
                      />
                      <div className="min-w-0">
                        <p className={`font-display text-[10px] uppercase tracking-[0.3em] ${presence.available ? 'text-chrome-secondary' : 'text-white/45'}`}>
                          {presence.available ? 'Present' : 'Unavailable'}
                        </p>
                        <h2 className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-white">{presence.label}</h2>
                        <p className="mt-1 font-body text-xs leading-4 text-white/62">
                          {presence.available ? presence.description : presence.lockedReason ?? presence.description}
                        </p>
                      </div>
                    </div>
                  </Panel>
                </button>
              )
            })}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              {entriesPage.pageItems.map((entry) => {
                if (entry.kind === 'character') {
                  const { presence, available } = entry
                  const npc = NPCS[presence.npcId]
                  if (available) {
                    return (
                      <button key={presence.label} type="button" onClick={() => onEnterStory(presence.storyLocationId)} className="text-left">
                        <Panel size="md" className="h-full p-4 transition-colors hover:!border-chrome-secondary hover:shadow-[0_0_18px_var(--color-chrome-secondary)]">
                          <div className="flex items-start gap-3">
                            <PortraitFrame src={npc.portraits?.neutral} alt={npc.name} fallbackText={npc.name.slice(0, 2).toUpperCase()} size="sm" />
                            <div className="min-w-0">
                              <p className="font-display text-xs uppercase tracking-[0.3em] text-chrome-secondary">Talk</p>
                              <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-white">{presence.label}</h2>
                              <EditableText className="mt-2 font-body text-sm text-white/62" value={presence.description} file="locationHubs" field="description" />
                            </div>
                          </div>
                        </Panel>
                      </button>
                    )
                  }
                  return (
                    <Panel key={`${presence.label}-locked`} size="md" accent="rgba(255,255,255,0.22)" className="h-full p-4 opacity-70">
                      <div className="flex items-start gap-3">
                        <PortraitFrame src={npc.portraits?.neutral} alt={npc.name} fallbackText={npc.name.slice(0, 2).toUpperCase()} size="sm" accent="rgba(255,255,255,0.45)" />
                        <div className="min-w-0">
                          <p className="font-display text-xs uppercase tracking-[0.3em] text-white/45">Unavailable</p>
                          <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-white">{presence.label}</h2>
                          {presence.lockedReason ? (
                            <EditableText className="mt-2 font-body text-sm text-white/55" value={presence.lockedReason} file="locationHubs" field="lockedReason" />
                          ) : (
                            <EditableText className="mt-2 font-body text-sm text-white/55" value={presence.description} file="locationHubs" field="description" />
                          )}
                        </div>
                      </div>
                    </Panel>
                  )
                }

                const { action, available } = entry
                if (available) {
                  return (
                    <button key={action.id} type="button" onClick={() => onEnterStory(action.storyLocationId)} className="text-left">
                      <Panel size="md" className="h-full p-4 transition-colors hover:!border-chrome-secondary hover:shadow-[0_0_18px_var(--color-chrome-secondary)]">
                        <p className="font-display text-xs uppercase tracking-[0.3em] text-chrome-primary">Inspect</p>
                        <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-white">{action.label}</h2>
                        <EditableText className="mt-2 font-body text-sm text-white/62" value={action.description} file="locationHubs" field="description" />
                      </Panel>
                    </button>
                  )
                }
                return (
                  <Panel key={`${action.id}-locked`} size="md" accent="rgba(255,255,255,0.22)" className="h-full p-4 opacity-70">
                    <p className="font-display text-xs uppercase tracking-[0.3em] text-white/45">Locked</p>
                    <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-white">{action.label}</h2>
                    {action.lockedReason ? (
                      <EditableText className="mt-2 font-body text-sm text-white/55" value={action.lockedReason} file="locationHubs" field="lockedReason" />
                    ) : (
                      <EditableText className="mt-2 font-body text-sm text-white/55" value={action.description} file="locationHubs" field="description" />
                    )}
                  </Panel>
                )
              })}
            </div>
            <PageControls page={entriesPage.page} pageCount={entriesPage.pageCount} onChange={entriesPage.setPage} className="mt-auto" />
          </div>

          <Panel size="lg" className="flex flex-col gap-4 p-5">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-chrome-secondary">Current Leads</h2>
              <p className="mt-2 font-body text-sm text-white/60">Choose who to talk to or what to inspect. Some people and areas are visible before they are truly available, which helps the hub read as a real place under pressure.</p>
            </div>

            <div className="flex flex-col gap-3">
              {entries.length === 0 && <p className="font-body text-sm text-white/45">No interactions are authored here yet.</p>}
              {entriesPage.pageItems.map((entry) => {
                if (entry.kind === 'character') {
                  const { presence, available } = entry
                  if (available) {
                    return (
                      <CyberButton key={`${presence.label}-fallback`} onClick={() => onEnterStory(presence.storyLocationId)} tag="Talk">
                        {presence.label}
                      </CyberButton>
                    )
                  }
                  return (
                    <Panel key={`${presence.label}-fallback-locked`} size="sm" accent="rgba(255,255,255,0.18)" className="p-3">
                      <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/45">Unavailable</p>
                      <p className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-white">{presence.label}</p>
                      <p className="mt-2 font-body text-xs text-white/55">{presence.lockedReason ?? presence.description}</p>
                    </Panel>
                  )
                }

                const { action, available } = entry
                if (available) {
                  return (
                    <CyberButton key={`${action.id}-fallback`} onClick={() => onEnterStory(action.storyLocationId)} tag="Inspect">
                      {action.label}
                    </CyberButton>
                  )
                }
                return (
                  <Panel key={`${action.id}-fallback-locked`} size="sm" accent="rgba(255,255,255,0.18)" className="p-3">
                    <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/45">Locked</p>
                    <p className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-white">{action.label}</p>
                    <p className="mt-2 font-body text-xs text-white/55">{action.lockedReason ?? action.description}</p>
                  </Panel>
                )
              })}
            </div>

            <div className="mt-auto border-t border-white/10 pt-4">
              <CyberButton onClick={onReturnToMap}>Return to Map</CyberButton>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
