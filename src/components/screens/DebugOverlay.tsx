// Dev-only debug menu (App.tsx's DebugButton, import.meta.env.DEV-gated).
// Home for one-off console-style tools as they're added — Map Builder is
// the first. Deliberately just a flat command list, not a real console;
// add new entries here as they come up rather than building a generic
// command-registry abstraction before there's more than one consumer.

import { useState } from 'react'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, Panel } from '../ui'
import { DebugFlagsTool } from './DebugFlagsTool'
import { MapBuilderTool } from './MapBuilderTool'

type DebugView = 'menu' | 'mapBuilder' | 'flags'

export function DebugOverlay() {
  const closeOverlay = useUiStore((s) => s.closeOverlay)
  const [view, setView] = useState<DebugView>('menu')

  return (
    <Panel
      size="lg"
      className="flex h-[95vh] w-[95vw] max-w-[1600px] flex-col gap-4 p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h1 className="font-display text-lg font-bold uppercase tracking-widest text-chrome-primary">
          Debug_Console
        </h1>
        <div className="flex gap-2">
          {view !== 'menu' && <CyberButton onClick={() => setView('menu')}>Back</CyberButton>}
          <CyberButton onClick={closeOverlay}>Close</CyberButton>
        </div>
      </div>

      {view === 'menu' && (
        <div className="flex flex-col gap-2">
          <CyberButton className="w-fit" onClick={() => setView('mapBuilder')}>
            Map Builder
          </CyberButton>
          <CyberButton className="w-fit" onClick={() => setView('flags')}>
            Flags
          </CyberButton>
          <p className="font-body text-sm text-white/35">More commands land here as they're needed.</p>
        </div>
      )}

      {view === 'mapBuilder' && <MapBuilderTool />}
      {view === 'flags' && <DebugFlagsTool />}
    </Panel>
  )
}
