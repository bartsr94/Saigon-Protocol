// Legacy card-grid Location Hub presentation (Architecture §7's Location
// Hub Layer), used for hubs that haven't earned a walkable grid yet
// (GAME_GUIDE.md §6.2). Extracted unchanged from LocationHubScreen.tsx's
// original body.

import { useMemo } from 'react'
import type { BackgroundDefinition } from '../../content/backgrounds'
import type { CardListHubDefinition } from '../../content/locationHubs'
import { NPCS } from '../../content/npcs'
import type { LocationId } from '../../content/locations'
import { CyberButton, Panel, PortraitFrame } from '../ui'

interface HubCardListViewProps {
  hub: CardListHubDefinition
  background: BackgroundDefinition | null
  onEnterStory: (id: LocationId) => void
  onReturnToMap: () => void
}

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
            <p className="font-body text-base leading-6 text-white/72">{hub.blurb}</p>
          </Panel>
        </div>

        <div className="pointer-events-none absolute inset-x-6 bottom-[27%] top-[23%] hidden xl:block">
          {groupedInteractions.talk.map((presence) => {
            const npc = NPCS[presence.npcId]
            return (
              <button
                key={`${presence.label}-anchor`}
                type="button"
                disabled={!presence.available}
                onClick={() => presence.available && onEnterStory(presence.storyLocationId)}
                className={`pointer-events-auto absolute w-52 -translate-x-1/2 -translate-y-1/2 text-left transition-transform ${
                  presence.available ? 'cursor-pointer hover:scale-[1.03]' : 'cursor-not-allowed opacity-70'
                }`}
                style={{ left: `${presence.anchor.x * 100}%`, top: `${presence.anchor.y * 100}%` }}
              >
                <Panel
                  size="sm"
                  accent={presence.available ? 'var(--color-chrome-primary)' : 'rgba(255,255,255,0.2)'}
                  className="p-3 backdrop-blur-lg"
                >
                  <div className="flex items-start gap-3">
                    <PortraitFrame
                      src={npc.portraitSrc}
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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid gap-4 md:grid-cols-2">
            {availableCharacters.map((presence) => {
              const npc = NPCS[presence.npcId]
              return (
                <button key={presence.label} type="button" onClick={() => onEnterStory(presence.storyLocationId)} className="text-left">
                  <Panel size="md" className="h-full p-4 transition-colors hover:!border-chrome-secondary hover:shadow-[0_0_18px_var(--color-chrome-secondary)]">
                    <div className="flex items-start gap-3">
                      <PortraitFrame src={npc.portraitSrc} alt={npc.name} fallbackText={npc.name.slice(0, 2).toUpperCase()} size="sm" />
                      <div className="min-w-0">
                        <p className="font-display text-xs uppercase tracking-[0.3em] text-chrome-secondary">Talk</p>
                        <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-white">{presence.label}</h2>
                        <p className="mt-2 font-body text-sm text-white/62">{presence.description}</p>
                      </div>
                    </div>
                  </Panel>
                </button>
              )
            })}

            {availableActions.map((action) => (
              <button key={action.id} type="button" onClick={() => onEnterStory(action.storyLocationId)} className="text-left">
                <Panel size="md" className="h-full p-4 transition-colors hover:!border-chrome-secondary hover:shadow-[0_0_18px_var(--color-chrome-secondary)]">
                  <p className="font-display text-xs uppercase tracking-[0.3em] text-chrome-primary">Inspect</p>
                  <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-white">{action.label}</h2>
                  <p className="mt-2 font-body text-sm text-white/62">{action.description}</p>
                </Panel>
              </button>
            ))}

            {unavailableCharacters.map((presence) => {
              const npc = NPCS[presence.npcId]
              return (
                <Panel key={`${presence.label}-locked`} size="md" accent="rgba(255,255,255,0.22)" className="h-full p-4 opacity-70">
                  <div className="flex items-start gap-3">
                    <PortraitFrame src={npc.portraitSrc} alt={npc.name} fallbackText={npc.name.slice(0, 2).toUpperCase()} size="sm" accent="rgba(255,255,255,0.45)" />
                    <div className="min-w-0">
                      <p className="font-display text-xs uppercase tracking-[0.3em] text-white/45">Unavailable</p>
                      <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-white">{presence.label}</h2>
                      <p className="mt-2 font-body text-sm text-white/55">{presence.lockedReason ?? presence.description}</p>
                    </div>
                  </div>
                </Panel>
              )
            })}

            {unavailableActions.map((action) => (
              <Panel key={`${action.id}-locked`} size="md" accent="rgba(255,255,255,0.22)" className="h-full p-4 opacity-70">
                <p className="font-display text-xs uppercase tracking-[0.3em] text-white/45">Locked</p>
                <h2 className="mt-1 font-display text-sm font-bold uppercase tracking-wide text-white">{action.label}</h2>
                <p className="mt-2 font-body text-sm text-white/55">{action.lockedReason ?? action.description}</p>
              </Panel>
            ))}
          </div>

          <Panel size="lg" className="flex flex-col gap-4 p-5">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-chrome-secondary">Current Leads</h2>
              <p className="mt-2 font-body text-sm text-white/60">Choose who to talk to or what to inspect. Some people and areas are visible before they are truly available, which helps the hub read as a real place under pressure.</p>
            </div>

            <div className="flex flex-col gap-3">
              {groupedInteractions.talk.length === 0 && groupedInteractions.inspect.length === 0 && (
                <p className="font-body text-sm text-white/45">No interactions are authored here yet.</p>
              )}
              {availableCharacters.map((presence) => (
                <CyberButton key={`${presence.label}-fallback`} onClick={() => onEnterStory(presence.storyLocationId)} tag="Talk">
                  {presence.label}
                </CyberButton>
              ))}
              {availableActions.map((action) => (
                <CyberButton key={`${action.id}-fallback`} onClick={() => onEnterStory(action.storyLocationId)} tag="Inspect">
                  {action.label}
                </CyberButton>
              ))}
              {unavailableCharacters.map((presence) => (
                <Panel key={`${presence.label}-fallback-locked`} size="sm" accent="rgba(255,255,255,0.18)" className="p-3">
                  <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/45">Unavailable</p>
                  <p className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-white">{presence.label}</p>
                  <p className="mt-2 font-body text-xs text-white/55">{presence.lockedReason ?? presence.description}</p>
                </Panel>
              ))}
              {unavailableActions.map((action) => (
                <Panel key={`${action.id}-fallback-locked`} size="sm" accent="rgba(255,255,255,0.18)" className="p-3">
                  <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/45">Locked</p>
                  <p className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-white">{action.label}</p>
                  <p className="mt-2 font-body text-xs text-white/55">{action.lockedReason ?? action.description}</p>
                </Panel>
              ))}
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
