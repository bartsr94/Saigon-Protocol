// Cases overlay (docs/GAME_GUIDE.md §9). Renamed/reworked from the old
// single-investigation CasefileOverlay: the game can now track several
// concurrent quest-lines at once (the main Case 1 investigation plus
// optional sidequests like Ophelia's), each with its own objectives and
// evidence/notes — driven by caseStore rather than a static always-visible
// fixture, so the player only sees cases that have actually been started.

import { useEffect, useMemo, useState } from 'react'
import {
  CASES,
  CASE_IDS,
  CASE_NOTES,
  CASE_NOTE_IDS,
  EVIDENCE,
  EVIDENCE_IDS,
  type CaseId,
  type CaseNoteId,
  type EvidenceId,
  type EvidenceTier,
} from '../../content/cases'
import { useCaseStore } from '../../stores/caseStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, PageControls, Panel, usePagination } from '../ui'

const TIER_COLOR: Record<EvidenceTier, string> = {
  flavor: 'rgba(255,255,255,0.45)',
  clue: 'var(--color-chrome-primary)',
  key: '#ffaa00',
}

// Both lists are paginated instead of scrolling (UI_PASS_SPEC.md §2) —
// bounded page sizes chosen to fit this Panel's fixed footprint regardless
// of how much evidence/notes content gets authored.
const EVIDENCE_PAGE_SIZE = 8
const NOTES_PAGE_SIZE = 3

/** Main cases first, then side; active before completed within each group — a quest log reads top-down by priority, not alphabetically. */
function sortCaseIds(ids: CaseId[], isCompleted: (id: CaseId) => boolean): CaseId[] {
  return [...ids].sort((a, b) => {
    const catDiff = (CASES[a].category === 'main' ? 0 : 1) - (CASES[b].category === 'main' ? 0 : 1)
    if (catDiff !== 0) return catDiff
    return Number(isCompleted(a)) - Number(isCompleted(b))
  })
}

export function CasesOverlay() {
  const closeOverlay = useUiStore((s) => s.closeOverlay)
  const evidenceIds = useCaseStore((s) => s.evidenceIds)
  const noteIds = useCaseStore((s) => s.noteIds)
  const isCaseActive = useCaseStore((s) => s.isCaseActive)
  const isCaseCompleted = useCaseStore((s) => s.isCaseCompleted)
  const isObjectiveComplete = useCaseStore((s) => s.isObjectiveComplete)

  const [tab, setTab] = useState<'evidence' | 'notes'>('evidence')
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<EvidenceId | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<CaseId | null>(null)

  const visibleCaseIds = useMemo(
    () => sortCaseIds(CASE_IDS.filter((id) => isCaseActive(id) || isCaseCompleted(id)), isCaseCompleted),
    [isCaseActive, isCaseCompleted],
  )

  useEffect(() => {
    if (selectedCaseId && visibleCaseIds.includes(selectedCaseId)) return
    setSelectedCaseId(visibleCaseIds[0] ?? null)
  }, [visibleCaseIds, selectedCaseId])

  const selectedCase = selectedCaseId ? CASES[selectedCaseId] : null

  const caseEvidenceIds = useMemo(
    () => (selectedCaseId ? EVIDENCE_IDS.filter((id) => EVIDENCE[id].caseId === selectedCaseId && evidenceIds.has(id)) : []),
    [selectedCaseId, evidenceIds],
  )
  const caseNoteIds = useMemo(
    () => (selectedCaseId ? CASE_NOTE_IDS.filter((id) => CASE_NOTES[id].caseId === selectedCaseId && noteIds.has(id)) : []),
    [selectedCaseId, noteIds],
  )
  const selectedEvidence = selectedEvidenceId && evidenceIds.has(selectedEvidenceId) ? EVIDENCE[selectedEvidenceId] : null
  const evidencePage = usePagination(caseEvidenceIds, EVIDENCE_PAGE_SIZE)
  const notesPage = usePagination(caseNoteIds, NOTES_PAGE_SIZE)

  useEffect(() => {
    if (selectedEvidenceId && caseEvidenceIds.includes(selectedEvidenceId)) return
    setSelectedEvidenceId(caseEvidenceIds[0] ?? null)
  }, [caseEvidenceIds, selectedEvidenceId])

  return (
    <Panel size="lg" className="flex w-full max-w-5xl flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-bold uppercase tracking-widest text-white">Cases</span>
        <CyberButton onClick={closeOverlay}>Close</CyberButton>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left column: every started case, main before side, active before completed. */}
        <div className="flex w-64 shrink-0 flex-col gap-2 overflow-y-auto pr-1">
          {visibleCaseIds.length === 0 && <p className="font-body text-sm text-white/35">No cases started yet.</p>}
          {visibleCaseIds.map((id) => {
            const def = CASES[id]
            const completed = isCaseCompleted(id)
            const active = id === selectedCaseId
            return (
              <button key={id} type="button" onClick={() => setSelectedCaseId(id)} className="text-left">
                <Panel
                  size="sm"
                  accent={active ? 'var(--color-chrome-secondary)' : 'rgba(255,255,255,0.18)'}
                  className="p-3"
                >
                  <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/45">
                    {def.category === 'main' ? 'Main Case' : 'Side Case'}
                  </p>
                  <h3 className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-white">{def.title}</h3>
                  <span
                    className="mt-2 inline-block border px-1.5 py-0.5 font-display text-[0.6rem] uppercase tracking-widest"
                    style={{
                      color: completed ? 'rgba(255,255,255,0.5)' : 'var(--color-chrome-primary)',
                      borderColor: completed ? 'rgba(255,255,255,0.3)' : 'var(--color-chrome-primary)',
                    }}
                  >
                    {completed ? 'Completed' : 'Active'}
                  </span>
                </Panel>
              </button>
            )
          })}
        </div>

        {/* Right column: selected case's summary, objectives, and its own Evidence/Notes. */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {!selectedCase ? (
            <p className="font-body text-sm text-white/30">Select a case.</p>
          ) : (
            <>
              <div>
                <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">{selectedCase.title}</h2>
                <p className="mt-2 font-body text-sm text-white/70">{selectedCase.summary}</p>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-chrome-secondary">Objectives</h3>
                {selectedCase.objectives.map((objective) => {
                  const done = isObjectiveComplete(selectedCase.id, objective.id)
                  return (
                    <div key={objective.id} className="flex items-start gap-2">
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border text-[0.6rem]"
                        style={{ borderColor: done ? 'var(--color-chrome-primary)' : 'rgba(255,255,255,0.3)', color: 'var(--color-chrome-primary)' }}
                      >
                        {done ? '✓' : ''}
                      </span>
                      <div className="min-w-0">
                        <p className={`font-body text-sm ${done ? 'text-white/45 line-through' : 'text-white/85'}`}>{objective.label}</p>
                        <p className="font-body text-xs text-white/45">{objective.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                <CyberButton className={tab === 'evidence' ? '!border-chrome-secondary !text-white' : ''} onClick={() => setTab('evidence')}>
                  Evidence
                </CyberButton>
                <CyberButton className={tab === 'notes' ? '!border-chrome-secondary !text-white' : ''} onClick={() => setTab('notes')}>
                  Case Notes
                </CyberButton>
              </div>

              {tab === 'evidence' ? (
                <div className="flex flex-1 gap-4 overflow-hidden">
                  <div className="flex flex-[2] flex-col gap-3">
                    <div className="grid auto-rows-min grid-cols-4 content-start gap-3">
                      {caseEvidenceIds.length === 0 && <p className="col-span-full font-body text-sm text-white/35">No logged evidence yet.</p>}
                      {evidencePage.pageItems.map((id) => {
                        const item = EVIDENCE[id]
                        const color = TIER_COLOR[item.tier]
                        return (
                          <button key={id} type="button" onClick={() => setSelectedEvidenceId(id)} className="aspect-square">
                            <div
                              className="flex h-full w-full items-center justify-center p-2 text-center font-body text-[0.65rem] text-white/80"
                              style={{
                                border: `1px solid ${color}`,
                                clipPath:
                                  'polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm))',
                                boxShadow: id === selectedEvidenceId ? `0 0 12px ${color}` : 'none',
                                background: `color-mix(in srgb, ${color} 10%, transparent)`,
                              }}
                            >
                              {item.name}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <PageControls page={evidencePage.page} pageCount={evidencePage.pageCount} onChange={evidencePage.setPage} className="mt-auto" />
                  </div>
                  <div className="flex-1 border-l border-white/10 pl-4">
                    {selectedEvidence ? (
                      <>
                        <h3 className="font-display text-base font-bold uppercase tracking-wide" style={{ color: TIER_COLOR[selectedEvidence.tier] }}>
                          {selectedEvidence.name}
                        </h3>
                        <span
                          className="mt-2 inline-block border px-1.5 py-0.5 font-display text-[0.65rem] uppercase tracking-widest"
                          style={{ color: TIER_COLOR[selectedEvidence.tier], borderColor: TIER_COLOR[selectedEvidence.tier] }}
                        >
                          {selectedEvidence.tier}
                        </span>
                        <p className="mt-3 font-body text-sm text-white/70">{selectedEvidence.description}</p>
                      </>
                    ) : (
                      <p className="font-body text-sm text-white/30">Select an item.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                  <div className="flex-1 space-y-4 overflow-y-auto">
                    {caseNoteIds.length === 0 && <p className="font-body text-sm text-white/35">No case notes yet.</p>}
                    {notesPage.pageItems.map((id: CaseNoteId) => {
                      const note = CASE_NOTES[id]
                      return (
                        <div key={note.id} className="border-l-2 border-chrome-primary pl-3">
                          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-chrome-primary">{note.heading}</h4>
                          <p className="font-body text-sm text-white/70">{note.body}</p>
                        </div>
                      )
                    })}
                  </div>
                  <PageControls page={notesPage.page} pageCount={notesPage.pageCount} onChange={notesPage.setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Panel>
  )
}
