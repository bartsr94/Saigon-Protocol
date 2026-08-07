// Casefile/Evidence overlay (docs/GAME_GUIDE.md §9). Now driven by
// casefileStore rather than a static always-visible fixture, so the player
// only sees what the current investigation has actually logged so far.

import { useEffect, useMemo, useState } from 'react'
import {
  CASE_NOTES,
  CASE_NOTE_IDS,
  EVIDENCE,
  EVIDENCE_IDS,
  type CaseNoteId,
  type EvidenceId,
  type EvidenceTier,
} from '../../content/casefile'
import { useCasefileStore } from '../../stores/casefileStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, Panel } from '../ui'

const TIER_COLOR: Record<EvidenceTier, string> = {
  flavor: 'rgba(255,255,255,0.45)',
  clue: 'var(--color-chrome-primary)',
  key: '#ffaa00',
}

export function CasefileOverlay() {
  const closeOverlay = useUiStore((s) => s.closeOverlay)
  const evidenceIds = useCasefileStore((s) => s.evidenceIds)
  const noteIds = useCasefileStore((s) => s.noteIds)
  const [tab, setTab] = useState<'evidence' | 'notes'>('evidence')
  const [selectedId, setSelectedId] = useState<EvidenceId | null>(null)

  const ownedEvidenceIds = useMemo(() => EVIDENCE_IDS.filter((id) => evidenceIds.has(id)), [evidenceIds])
  const unlockedNoteIds = useMemo(() => CASE_NOTE_IDS.filter((id) => noteIds.has(id)), [noteIds])
  const selected = selectedId && evidenceIds.has(selectedId) ? EVIDENCE[selectedId] : null

  useEffect(() => {
    if (selectedId && evidenceIds.has(selectedId)) return
    setSelectedId(ownedEvidenceIds[0] ?? null)
  }, [ownedEvidenceIds, evidenceIds, selectedId])

  return (
    <Panel size="lg" className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <CyberButton className={tab === 'evidence' ? '!border-chrome-secondary !text-white' : ''} onClick={() => setTab('evidence')}>
            Evidence
          </CyberButton>
          <CyberButton className={tab === 'notes' ? '!border-chrome-secondary !text-white' : ''} onClick={() => setTab('notes')}>
            Case Notes
          </CyberButton>
        </div>
        <CyberButton onClick={closeOverlay}>Close</CyberButton>
      </div>

      {tab === 'evidence' ? (
        <div className="flex flex-1 gap-4 overflow-hidden">
          <div className="grid flex-[2] auto-rows-min grid-cols-4 content-start gap-3 overflow-y-auto">
            {ownedEvidenceIds.length === 0 && <p className="col-span-full font-body text-sm text-white/35">No logged evidence yet.</p>}
            {ownedEvidenceIds.map((id) => {
              const item = EVIDENCE[id]
              const color = TIER_COLOR[item.tier]
              return (
                <button key={id} type="button" onClick={() => setSelectedId(id)} className="aspect-square">
                  <div
                    className="flex h-full w-full items-center justify-center p-2 text-center font-body text-[0.65rem] text-white/80"
                    style={{
                      border: `1px solid ${color}`,
                      clipPath:
                        'polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm))',
                      boxShadow: id === selectedId ? `0 0 12px ${color}` : 'none',
                      background: `color-mix(in srgb, ${color} 10%, transparent)`,
                    }}
                  >
                    {item.name}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex-1 border-l border-white/10 pl-4">
            {selected ? (
              <>
                <h3 className="font-display text-base font-bold uppercase tracking-wide" style={{ color: TIER_COLOR[selected.tier] }}>
                  {selected.name}
                </h3>
                <span
                  className="mt-2 inline-block border px-1.5 py-0.5 font-display text-[0.65rem] uppercase tracking-widest"
                  style={{ color: TIER_COLOR[selected.tier], borderColor: TIER_COLOR[selected.tier] }}
                >
                  {selected.tier}
                </span>
                <p className="mt-3 font-body text-sm text-white/70">{selected.description}</p>
              </>
            ) : (
              <p className="font-body text-sm text-white/30">Select an item.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto">
          {unlockedNoteIds.length === 0 && <p className="font-body text-sm text-white/35">No case notes yet.</p>}
          {unlockedNoteIds.map((id: CaseNoteId) => {
            const note = CASE_NOTES[id]
            return (
              <div key={note.id} className="border-l-2 border-chrome-primary pl-3">
                <h4 className="font-display text-sm font-bold uppercase tracking-wide text-chrome-primary">{note.heading}</h4>
                <p className="font-body text-sm text-white/70">{note.body}</p>
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
