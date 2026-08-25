// Live topic editor (docs/LIVE_TOPIC_EDITOR_SPEC.md) — lets a dev
// add/edit/remove/reorder an NPC's repeat-visit topics (the `* [label] spoken
// line` / response pairs inside their `topicsKnot` loop, GAME_GUIDE.md §5.2)
// straight from Conversation
// View. Writes back to whichever `.ink` file actually contains that knot —
// `content/ink/<district>/<storyLocationId>.ink` itself, or one of its
// INCLUDEd per-character files (e.g. content/ink/district4/aveline/) — resolved and
// recompiled in-process by vite-plugins/debugTopicEditPlugin.ts. Only "simple"
// topics (inkTopicSerializer.ts's shape — no roll_check, no conditional, no
// case grant) are editable; anything else is shown read-only and
// re-saved byte-for-byte untouched.
//
// Rendered as a `fixed inset-0 z-50` panel, same as MapEditorPanel's live
// overlay in HubGridView.tsx — that full-viewport coverage is what keeps it
// from stacking with a NavRail-triggered uiStore overlay, no separate
// mutual-exclusion store needed (this panel only ever opens from inside
// ConversationScreen, unlike the map editor's multi-screen case).

import { useEffect, useState } from 'react'
import { INSIGHT_IDS, INSIGHTS } from '../../content/insights'
import { NPCS, type NpcId } from '../../content/npcs'
import { CyberButton, Panel } from '../ui'

interface SimpleTopic {
  kind: 'simple'
  choiceText: string
  insightTag?: string
  spokenText?: string
  responseText: string
  speakerNpcId?: string
}

interface ComplexTopic {
  kind: 'complex'
  raw: string
}

type TopicBlock = SimpleTopic | ComplexTopic

interface TopicEditorPanelProps {
  storyLocationId: string
  knotName: string
  npcId: NpcId
  onClose: () => void
}

const INPUT_CLASS = 'w-full border border-white/20 bg-black/50 px-2 py-1 font-body text-xs text-white outline-none focus:border-chrome-secondary'

function blankTopic(npcId: NpcId): SimpleTopic {
  return { kind: 'simple', choiceText: '', insightTag: undefined, spokenText: '', responseText: '', speakerNpcId: npcId }
}

async function fetchTopics(storyLocationId: string, knotName: string): Promise<{ topics?: TopicBlock[]; error?: string }> {
  try {
    const res = await fetch(`/__debug/topics?storyLocationId=${encodeURIComponent(storyLocationId)}&knotName=${encodeURIComponent(knotName)}`)
    const body: { topics?: TopicBlock[]; error?: string } = await res.json()
    return res.ok ? { topics: body.topics ?? [] } : { error: body.error ?? 'Failed to load topics.' }
  } catch {
    return { error: 'Failed to load topics — is the dev server running?' }
  }
}

async function saveTopics(storyLocationId: string, knotName: string, topics: TopicBlock[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/__debug/save-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyLocationId, knotName, topics }),
    })
    const body: { error?: string; details?: string[] } = await res.json()
    if (res.ok) return { ok: true }
    return { ok: false, error: [body.error, ...(body.details ?? [])].filter(Boolean).join(' — ') }
  } catch {
    return { ok: false, error: 'Save failed — is the dev server running?' }
  }
}

export function TopicEditorPanel({ storyLocationId, knotName, npcId, onClose }: TopicEditorPanelProps) {
  const [topics, setTopics] = useState<TopicBlock[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchTopics(storyLocationId, knotName).then((result) => {
      if (cancelled) return
      if (result.topics) setTopics(result.topics)
      else setLoadError(result.error ?? 'Failed to load topics.')
    })
    return () => {
      cancelled = true
    }
  }, [storyLocationId, knotName])

  function updateSimpleTopic(index: number, patch: Partial<SimpleTopic>) {
    setTopics((list) => list?.map((t, i) => (i === index && t.kind === 'simple' ? { ...t, ...patch } : t)) ?? list)
  }

  function removeTopic(index: number) {
    setTopics((list) => list?.filter((_, i) => i !== index) ?? list)
  }

  function moveTopic(index: number, direction: -1 | 1) {
    setTopics((list) => {
      if (!list) return list
      const target = index + direction
      if (target < 0 || target >= list.length) return list
      const next = [...list]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function addTopic() {
    setTopics((list) => [...(list ?? []), blankTopic(npcId)])
  }

  async function handleSave() {
    if (!topics) return
    setSaving(true)
    setSaveStatus('')
    const result = await saveTopics(storyLocationId, knotName, topics)
    setSaving(false)
    setSaveStatus(result.ok ? 'Saved.' : (result.error ?? 'Save failed.'))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <Panel size="lg" className="flex h-[90vh] w-[90vw] max-w-[900px] flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h1 className="font-display text-lg font-bold uppercase tracking-widest text-chrome-primary">
            Edit_Topics — {NPCS[npcId].name} ({knotName})
          </h1>
          <CyberButton onClick={onClose}>Close</CyberButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {loadError && <p className="font-body text-sm text-red-400">{loadError}</p>}
          {!loadError && !topics && <p className="font-body text-sm text-white/50">Loading…</p>}

          {topics?.map((topic, index) =>
            topic.kind === 'complex' ? (
              <div key={index} className="border border-white/10 bg-black/30 p-3">
                <p className="mb-2 font-body text-xs text-white/40">
                  Not editable here — check/case logic. Hand-edit the <code>{storyLocationId}</code> story's <code>.ink</code> source directly.
                </p>
                <pre className="whitespace-pre-wrap font-mono text-[11px] text-white/60">{topic.raw}</pre>
              </div>
            ) : (
              <div key={index} className="space-y-2 border border-chrome-secondary/30 bg-black/30 p-3">
                <div className="flex items-center gap-2">
                  <input
                    className={INPUT_CLASS}
                    value={topic.choiceText}
                    placeholder="Topic label (short — this is the button text)"
                    onChange={(e) => updateSimpleTopic(index, { choiceText: e.target.value })}
                  />
                  <select
                    className={INPUT_CLASS}
                    style={{ width: '11rem' }}
                    value={topic.insightTag ?? ''}
                    onChange={(e) => updateSimpleTopic(index, { insightTag: e.target.value || undefined })}
                  >
                    <option value="">No Insight</option>
                    {INSIGHT_IDS.map((id) => (
                      <option key={id} value={id}>
                        {INSIGHTS[id].name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className={INPUT_CLASS}
                  value={topic.spokenText ?? ''}
                  placeholder="Spoken line (optional — what the detective actually says, shown in the transcript when picked)"
                  onChange={(e) => updateSimpleTopic(index, { spokenText: e.target.value || undefined })}
                />
                <textarea
                  className={INPUT_CLASS}
                  rows={3}
                  value={topic.responseText}
                  placeholder="Response text"
                  onChange={(e) => updateSimpleTopic(index, { responseText: e.target.value })}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-body text-xs text-white/60">
                    <input
                      type="checkbox"
                      checked={topic.speakerNpcId === npcId}
                      onChange={(e) => updateSimpleTopic(index, { speakerNpcId: e.target.checked ? npcId : undefined })}
                    />
                    Speaker: {topic.speakerNpcId === npcId ? NPCS[npcId].name : 'Narrator'}
                  </label>
                  <div className="flex gap-2">
                    <CyberButton className="!px-2 !py-1 !text-[10px]" disabled={index === 0} onClick={() => moveTopic(index, -1)}>
                      Up
                    </CyberButton>
                    <CyberButton
                      className="!px-2 !py-1 !text-[10px]"
                      disabled={index === (topics?.length ?? 0) - 1}
                      onClick={() => moveTopic(index, 1)}
                    >
                      Down
                    </CyberButton>
                    <CyberButton className="!px-2 !py-1 !text-[10px] !border-red-400 !text-red-400" onClick={() => removeTopic(index)}>
                      Remove
                    </CyberButton>
                  </div>
                </div>
              </div>
            ),
          )}

          {topics && (
            <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={addTopic}>
              Add Topic
            </CyberButton>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 pt-3">
          <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={handleSave} disabled={saving || !topics}>
            {saving ? 'Saving…' : 'Save'}
          </CyberButton>
          {saveStatus && <span className="font-body text-xs text-white/50">{saveStatus}</span>}
        </div>
      </Panel>
    </div>
  )
}
