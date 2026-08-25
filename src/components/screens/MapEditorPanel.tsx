// Grid/POI/door editor extracted from MapBuilderTool.tsx so the same
// tile-painting + interaction-editing UI can be reused two ways: blank-start
// with a copy/paste JSON export (MapBuilderTool.tsx, DebugOverlay's "Map
// Builder" tool), or seeded from a real hub/street and saved straight to
// disk (the live map editor — docs/LIVE_MAP_EDITOR_SPEC.md, wired into
// HubGridView.tsx/DistrictStreetView.tsx). Still has no fog-of-war,
// background art, or sprites — it only needs to produce the same
// `layoutRows` + `pois[]` shape those content modules use, not look like the
// real screens.

import { useState } from 'react'
import { BACKGROUND_IDS } from '../../content/backgrounds'
import { LOCATION_IDS } from '../../content/locations'
import { NPC_IDS } from '../../content/npcs'
import { CyberButton, NeonCheckbox } from '../ui'

export type BuilderMode = 'hub' | 'street'
export type TileKind = 'wall' | 'floor' | 'void'
type Brush = TileKind | 'poi' | 'door' | 'entry'
type InteractionType = 'talk' | 'inspect'

export interface BuilderInteraction {
  id: string
  type: InteractionType
  npcId: string
  label: string
  description: string
  storyLocationId: string
  available: boolean
  lockedReason: string
}

export interface BuilderPoi {
  id: string
  x: number
  y: number
  /** Hub-mode payload. */
  interactions: BuilderInteraction[]
  /** Street-mode payload. */
  locationId: string
  label: string
  description: string
  lockedReason: string
}

/** A gate blocking off part of the grid until `unlockFlag` is set on caseStore — see locationHubs.ts's `HubDoor`. */
export interface BuilderDoor {
  id: string
  x: number
  y: number
  unlockFlag: string
  label: string
  lockedReason: string
}

/** Everything needed to seed the editor from an existing hub/street record — see mapEditorSeed.ts. */
export interface BuilderSeed {
  id: string
  name: string
  blurb: string
  backgroundId: string
  visionRadius: string
  grid: TileKind[][]
  pois: BuilderPoi[]
  doors: BuilderDoor[]
  entryTile: { x: number; y: number } | null
}

export interface SaveResult {
  ok: boolean
  error?: string
}

interface MapEditorPanelProps {
  initialMode?: BuilderMode
  /** False for the live editor — switching a real hub/street's shape mid-edit doesn't make sense. */
  allowModeSwitch?: boolean
  initialData?: BuilderSeed
  /** When provided, replaces the Generate Export/Copy footer with a direct Save button. */
  onSave?: (record: object) => Promise<SaveResult>
  saveLabel?: string
}

const TILE_CHAR: Record<TileKind, string> = { wall: '#', floor: '.', void: ' ' }
const CELL_CLASS: Record<TileKind | 'poi' | 'door', string> = {
  wall: 'bg-white/25',
  floor: 'bg-white/5',
  void: 'bg-transparent',
  poi: 'bg-chrome-secondary/40',
  door: 'bg-red-500/40',
}
const BRUSHES: { id: Brush; label: string }[] = [
  { id: 'floor', label: 'Floor' },
  { id: 'wall', label: 'Wall' },
  { id: 'void', label: 'Void' },
  { id: 'poi', label: 'POI' },
  { id: 'door', label: 'Door' },
  { id: 'entry', label: 'Entry' },
]
const INPUT_CLASS = 'border border-white/20 bg-black/50 px-2 py-1 font-body text-xs text-white outline-none focus:border-chrome-secondary'

const INITIAL_WIDTH = 8
const INITIAL_HEIGHT = 6

let nextPoiSeq = 1
let nextInteractionSeq = 1
let nextDoorSeq = 1

function makeGrid(width: number, height: number, fill: TileKind): TileKind[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill))
}

function resizeGrid(grid: TileKind[][], width: number, height: number): TileKind[][] {
  return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => grid[y]?.[x] ?? 'void'))
}

function paintCell(grid: TileKind[][], x: number, y: number, kind: TileKind): TileKind[][] {
  return grid.map((row, ry) => (ry === y ? row.map((cell, rx) => (rx === x ? kind : cell)) : row))
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function makePoi(x: number, y: number): BuilderPoi {
  return {
    id: `poi-${nextPoiSeq++}`,
    x,
    y,
    interactions: [],
    locationId: '',
    label: '',
    description: '',
    lockedReason: '',
  }
}

function makeInteraction(): BuilderInteraction {
  return {
    id: `interaction-${nextInteractionSeq++}`,
    type: 'talk',
    npcId: '',
    label: '',
    description: '',
    storyLocationId: '',
    available: true,
    lockedReason: '',
  }
}

function makeDoor(x: number, y: number): BuilderDoor {
  return {
    id: `door-${nextDoorSeq++}`,
    x,
    y,
    unlockFlag: '',
    label: '',
    lockedReason: '',
  }
}

export function MapEditorPanel({ initialMode = 'hub', allowModeSwitch = true, initialData, onSave, saveLabel = 'Save' }: MapEditorPanelProps) {
  const [mode, setMode] = useState<BuilderMode>(initialMode)
  const [id, setId] = useState(initialData?.id ?? '')
  const [name, setName] = useState(initialData?.name ?? '')
  const [blurb, setBlurb] = useState(initialData?.blurb ?? '')
  const [backgroundId, setBackgroundId] = useState(initialData?.backgroundId ?? '')
  const [visionRadius, setVisionRadius] = useState(initialData?.visionRadius ?? '')
  const [grid, setGrid] = useState<TileKind[][]>(() => initialData?.grid ?? makeGrid(INITIAL_WIDTH, INITIAL_HEIGHT, 'void'))
  const [widthInput, setWidthInput] = useState(String(initialData?.grid[0]?.length ?? INITIAL_WIDTH))
  const [heightInput, setHeightInput] = useState(String(initialData?.grid.length ?? INITIAL_HEIGHT))
  const [pois, setPois] = useState<BuilderPoi[]>(() => initialData?.pois ?? [])
  const [doors, setDoors] = useState<BuilderDoor[]>(() => initialData?.doors ?? [])
  const [entryTile, setEntryTile] = useState<{ x: number; y: number } | null>(initialData?.entryTile ?? null)
  const [brush, setBrush] = useState<Brush>('floor')
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null)
  const [exportText, setExportText] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  const height = grid.length
  const width = grid[0]?.length ?? 0
  const selectedPoi = pois.find((p) => p.id === selectedPoiId) ?? null
  const selectedDoor = doors.find((d) => d.id === selectedDoorId) ?? null

  function poiAt(x: number, y: number): BuilderPoi | null {
    return pois.find((p) => p.x === x && p.y === y) ?? null
  }

  function doorAt(x: number, y: number): BuilderDoor | null {
    return doors.find((d) => d.x === x && d.y === y) ?? null
  }

  function applySize() {
    const w = clamp(Number(widthInput) || width, 1, 40)
    const h = clamp(Number(heightInput) || height, 1, 40)
    setGrid((g) => resizeGrid(g, w, h))
    setPois((list) => list.filter((p) => p.x < w && p.y < h))
    setDoors((list) => list.filter((d) => d.x < w && d.y < h))
    setEntryTile((e) => (e && e.x < w && e.y < h ? e : null))
    setWidthInput(String(w))
    setHeightInput(String(h))
  }

  function handleCellClick(x: number, y: number) {
    const existingPoi = poiAt(x, y)
    const existingDoor = doorAt(x, y)

    if (brush === 'entry') {
      setEntryTile({ x, y })
      return
    }

    if (brush === 'poi') {
      if (existingPoi) {
        setSelectedPoiId(existingPoi.id)
        setSelectedDoorId(null)
        return
      }
      if (existingDoor) setDoors((list) => list.filter((d) => d.id !== existingDoor.id))
      setGrid((g) => paintCell(g, x, y, 'floor'))
      const created = makePoi(x, y)
      setPois((list) => [...list, created])
      setSelectedPoiId(created.id)
      setSelectedDoorId(null)
      return
    }

    if (brush === 'door') {
      if (existingDoor) {
        setSelectedDoorId(existingDoor.id)
        setSelectedPoiId(null)
        return
      }
      if (existingPoi) setPois((list) => list.filter((p) => p.id !== existingPoi.id))
      setGrid((g) => paintCell(g, x, y, 'floor'))
      const created = makeDoor(x, y)
      setDoors((list) => [...list, created])
      setSelectedDoorId(created.id)
      setSelectedPoiId(null)
      return
    }

    if (existingPoi) {
      setPois((list) => list.filter((p) => p.id !== existingPoi.id))
      setSelectedPoiId((sel) => (sel === existingPoi.id ? null : sel))
    }
    if (existingDoor) {
      setDoors((list) => list.filter((d) => d.id !== existingDoor.id))
      setSelectedDoorId((sel) => (sel === existingDoor.id ? null : sel))
    }
    setGrid((g) => paintCell(g, x, y, brush))
  }

  function updatePoi(poiId: string, patch: Partial<BuilderPoi>) {
    setPois((list) => list.map((p) => (p.id === poiId ? { ...p, ...patch } : p)))
  }

  function deletePoi(poiId: string) {
    setPois((list) => list.filter((p) => p.id !== poiId))
    setSelectedPoiId((sel) => (sel === poiId ? null : sel))
  }

  function updateDoor(doorId: string, patch: Partial<BuilderDoor>) {
    setDoors((list) => list.map((d) => (d.id === doorId ? { ...d, ...patch } : d)))
  }

  function deleteDoor(doorId: string) {
    setDoors((list) => list.filter((d) => d.id !== doorId))
    setSelectedDoorId((sel) => (sel === doorId ? null : sel))
  }

  function addInteraction(poi: BuilderPoi) {
    updatePoi(poi.id, { interactions: [...poi.interactions, makeInteraction()] })
  }

  function updateInteraction(poi: BuilderPoi, interactionId: string, patch: Partial<BuilderInteraction>) {
    updatePoi(poi.id, { interactions: poi.interactions.map((i) => (i.id === interactionId ? { ...i, ...patch } : i)) })
  }

  function removeInteraction(poi: BuilderPoi, interactionId: string) {
    updatePoi(poi.id, { interactions: poi.interactions.filter((i) => i.id !== interactionId) })
  }

  function buildExport(): object {
    const layoutRows = grid.map((row, y) => row.map((cell, x) => (doorAt(x, y) ? 'd' : poiAt(x, y) ? 'o' : TILE_CHAR[cell])).join(''))
    const resolvedVisionRadius = visionRadius.trim() === '' ? undefined : Number(visionRadius)
    const resolvedEntryTile = entryTile ?? { x: 0, y: 0 }
    const exportedDoors = doors.map((d) => ({
      id: d.id,
      position: { x: d.x, y: d.y },
      unlockFlag: d.unlockFlag,
      label: d.label,
      lockedReason: d.lockedReason,
    }))

    if (mode === 'hub') {
      return {
        id: id || 'newHub',
        name,
        blurb,
        backgroundId: backgroundId || null,
        layout: 'grid',
        grid: {
          width,
          height,
          entryTile: resolvedEntryTile,
          layoutRows,
          doors: exportedDoors,
          pois: pois.map((p) => ({
            id: p.id,
            position: { x: p.x, y: p.y },
            interactions: p.interactions.map((i) => ({
              id: i.id,
              type: i.type,
              npcId: i.type === 'talk' ? i.npcId || undefined : undefined,
              label: i.label,
              description: i.description,
              storyLocationId: i.storyLocationId,
              available: i.available,
              lockedReason: i.lockedReason || undefined,
            })),
          })),
          visionRadius: resolvedVisionRadius,
        },
      }
    }

    return {
      id: id || 'newDistrict',
      name,
      blurb,
      backgroundId: backgroundId || null,
      width,
      height,
      entryTile: resolvedEntryTile,
      layoutRows,
      doors: exportedDoors,
      pois: pois.map((p) => ({
        id: p.id,
        position: { x: p.x, y: p.y },
        locationId: p.locationId,
        label: p.label,
        description: p.description,
        lockedReason: p.lockedReason || undefined,
      })),
      visionRadius: resolvedVisionRadius,
    }
  }

  function handleExport() {
    setExportText(JSON.stringify(buildExport(), null, 2))
    setCopyStatus('')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopyStatus('Copied.')
    } catch {
      setCopyStatus('Copy failed — select the text and copy manually.')
    }
  }

  async function handleSave() {
    if (!onSave) return
    setSaving(true)
    setSaveStatus('')
    const result = await onSave(buildExport())
    setSaving(false)
    setSaveStatus(result.ok ? 'Saved.' : (result.error ?? 'Save failed.'))
  }

  return (
    <div className="flex flex-1 gap-6 overflow-hidden">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-2">
        {allowModeSwitch && (
          <div className="flex gap-2">
            <CyberButton className={`!px-3 !py-1.5 !text-xs ${mode === 'hub' ? '!border-chrome-secondary !text-white' : ''}`} onClick={() => setMode('hub')}>
              Location Hub
            </CyberButton>
            <CyberButton className={`!px-3 !py-1.5 !text-xs ${mode === 'street' ? '!border-chrome-secondary !text-white' : ''}`} onClick={() => setMode('street')}>
              District Street
            </CyberButton>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="id"
            readOnly={!!onSave}
            title={onSave ? "Locked — the live editor only saves to this record's existing id." : undefined}
            className={`${INPUT_CLASS} ${onSave ? 'opacity-60' : ''}`}
          />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" className={INPUT_CLASS} />
          <input value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="blurb" className={`${INPUT_CLASS} col-span-2`} />
          <input
            list="map-builder-bg-ids"
            value={backgroundId}
            onChange={(e) => setBackgroundId(e.target.value)}
            placeholder="backgroundId (optional)"
            className={INPUT_CLASS}
          />
          <input
            value={visionRadius}
            onChange={(e) => setVisionRadius(e.target.value)}
            placeholder="visionRadius (optional)"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[0.65rem] uppercase tracking-widest text-white/50">
            Width
            <input type="number" min={1} max={40} value={widthInput} onChange={(e) => setWidthInput(e.target.value)} className={`${INPUT_CLASS} w-16`} />
          </label>
          <label className="flex flex-col gap-1 text-[0.65rem] uppercase tracking-widest text-white/50">
            Height
            <input type="number" min={1} max={40} value={heightInput} onChange={(e) => setHeightInput(e.target.value)} className={`${INPUT_CLASS} w-16`} />
          </label>
          <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={applySize}>
            Resize
          </CyberButton>
          <span className="font-body text-xs text-white/40">
            {width}×{height} · entry: {entryTile ? `${entryTile.x},${entryTile.y}` : 'unset'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {BRUSHES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBrush(b.id)}
              className={`border px-2 py-1 font-display text-[0.65rem] uppercase tracking-widest ${
                brush === b.id ? 'border-chrome-secondary text-chrome-secondary' : 'border-white/20 text-white/50'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="w-fit max-w-full overflow-auto border border-white/10">
          <div
            className="grid w-fit"
            style={{ gridTemplateColumns: `repeat(${width}, 4rem)`, gridTemplateRows: `repeat(${height}, 4rem)` }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => {
                const poi = poiAt(x, y)
                const door = doorAt(x, y)
                const isEntry = entryTile?.x === x && entryTile?.y === y
                const isSelected = (poi && selectedPoiId === poi.id) || (door && selectedDoorId === door.id)
                return (
                  <button
                    key={`${x},${y}`}
                    type="button"
                    onClick={() => handleCellClick(x, y)}
                    title={door ? `Door: ${door.id}` : poi ? `POI: ${poi.id}` : `${x},${y}`}
                    className={`flex items-center justify-center border border-black/40 font-display text-lg font-bold text-white ${
                      CELL_CLASS[door ? 'door' : poi ? 'poi' : cell]
                    } ${isSelected ? 'ring-2 ring-inset ring-chrome-secondary' : ''}`}
                  >
                    {isEntry ? 'S' : door ? 'd' : poi ? 'o' : ''}
                  </button>
                )
              }),
            )}
          </div>
        </div>
        <p className="font-body text-xs text-white/35">
          # wall · blank void · faint tile floor · magenta = POI · red = locked door · S = entry tile. Painting wall/void/floor over a POI or door clears it.
        </p>
      </div>

      <div className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/10 pl-4">
        <div>
          <h3 className="font-display text-xs uppercase tracking-widest text-white/60">POIs ({pois.length})</h3>
          <div className="mt-2 flex max-h-32 flex-col gap-1 overflow-y-auto">
            {pois.length === 0 && <p className="font-body text-xs text-white/30">None yet — pick the POI brush and click a tile.</p>}
            {pois.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPoiId(p.id)
                  setSelectedDoorId(null)
                }}
                className={`border px-2 py-1 text-left font-body text-xs ${
                  selectedPoiId === p.id ? 'border-chrome-secondary text-white' : 'border-white/10 text-white/60'
                }`}
              >
                {p.id} ({p.x},{p.y})
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-xs uppercase tracking-widest text-white/60">Doors ({doors.length})</h3>
          <div className="mt-2 flex max-h-32 flex-col gap-1 overflow-y-auto">
            {doors.length === 0 && <p className="font-body text-xs text-white/30">None yet — pick the Door brush and click a tile.</p>}
            {doors.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setSelectedDoorId(d.id)
                  setSelectedPoiId(null)
                }}
                className={`border px-2 py-1 text-left font-body text-xs ${
                  selectedDoorId === d.id ? 'border-chrome-secondary text-white' : 'border-white/10 text-white/60'
                }`}
              >
                {d.id} ({d.x},{d.y})
              </button>
            ))}
          </div>
        </div>

        {selectedDoor && (
          <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2">
              <input
                value={selectedDoor.id}
                onChange={(e) => {
                  updateDoor(selectedDoor.id, { id: e.target.value })
                  setSelectedDoorId(e.target.value)
                }}
                className={`${INPUT_CLASS} flex-1`}
              />
              <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => deleteDoor(selectedDoor.id)}>
                Delete
              </CyberButton>
            </div>
            <input
              value={selectedDoor.unlockFlag}
              onChange={(e) => updateDoor(selectedDoor.id, { unlockFlag: e.target.value })}
              placeholder="unlockFlag (caseStore flag id)"
              className={INPUT_CLASS}
            />
            <input
              value={selectedDoor.label}
              onChange={(e) => updateDoor(selectedDoor.id, { label: e.target.value })}
              placeholder="label"
              className={INPUT_CLASS}
            />
            <textarea
              value={selectedDoor.lockedReason}
              onChange={(e) => updateDoor(selectedDoor.id, { lockedReason: e.target.value })}
              placeholder="lockedReason"
              rows={2}
              className={INPUT_CLASS}
            />
          </div>
        )}

        {selectedPoi && (
          <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2">
              <input
                value={selectedPoi.id}
                onChange={(e) => {
                  updatePoi(selectedPoi.id, { id: e.target.value })
                  setSelectedPoiId(e.target.value)
                }}
                className={`${INPUT_CLASS} flex-1`}
              />
              <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => deletePoi(selectedPoi.id)}>
                Delete
              </CyberButton>
            </div>

            {mode === 'street' ? (
              <>
                <input
                  list="map-builder-location-ids"
                  value={selectedPoi.locationId}
                  onChange={(e) => updatePoi(selectedPoi.id, { locationId: e.target.value })}
                  placeholder="locationId"
                  className={INPUT_CLASS}
                />
                <input
                  value={selectedPoi.label}
                  onChange={(e) => updatePoi(selectedPoi.id, { label: e.target.value })}
                  placeholder="label"
                  className={INPUT_CLASS}
                />
                <textarea
                  value={selectedPoi.description}
                  onChange={(e) => updatePoi(selectedPoi.id, { description: e.target.value })}
                  placeholder="description"
                  rows={2}
                  className={INPUT_CLASS}
                />
                <input
                  value={selectedPoi.lockedReason}
                  onChange={(e) => updatePoi(selectedPoi.id, { lockedReason: e.target.value })}
                  placeholder="lockedReason (optional)"
                  className={INPUT_CLASS}
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs text-white/50">Interactions</span>
                  <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => addInteraction(selectedPoi)}>
                    + Add
                  </CyberButton>
                </div>
                {selectedPoi.interactions.map((i) => (
                  <div key={i.id} className="flex flex-col gap-1 border border-white/10 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={i.type}
                        onChange={(e) => updateInteraction(selectedPoi, i.id, { type: e.target.value as InteractionType })}
                        className={INPUT_CLASS}
                      >
                        <option value="talk">talk</option>
                        <option value="inspect">inspect</option>
                      </select>
                      <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => removeInteraction(selectedPoi, i.id)}>
                        Remove
                      </CyberButton>
                    </div>
                    {i.type === 'talk' && (
                      <input
                        list="map-builder-npc-ids"
                        value={i.npcId}
                        onChange={(e) => updateInteraction(selectedPoi, i.id, { npcId: e.target.value })}
                        placeholder="npcId"
                        className={INPUT_CLASS}
                      />
                    )}
                    <input
                      value={i.label}
                      onChange={(e) => updateInteraction(selectedPoi, i.id, { label: e.target.value })}
                      placeholder="label"
                      className={INPUT_CLASS}
                    />
                    <textarea
                      value={i.description}
                      onChange={(e) => updateInteraction(selectedPoi, i.id, { description: e.target.value })}
                      placeholder="description"
                      rows={2}
                      className={INPUT_CLASS}
                    />
                    <input
                      list="map-builder-location-ids"
                      value={i.storyLocationId}
                      onChange={(e) => updateInteraction(selectedPoi, i.id, { storyLocationId: e.target.value })}
                      placeholder="storyLocationId"
                      className={INPUT_CLASS}
                    />
                    <NeonCheckbox label="Available" checked={i.available} onChange={(v) => updateInteraction(selectedPoi, i.id, { available: v })} />
                    <input
                      value={i.lockedReason}
                      onChange={(e) => updateInteraction(selectedPoi, i.id, { lockedReason: e.target.value })}
                      placeholder="lockedReason (optional)"
                      className={INPUT_CLASS}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
          {onSave ? (
            <div className="flex items-center gap-2">
              <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : saveLabel}
              </CyberButton>
              {saveStatus && <span className="font-body text-xs text-white/50">{saveStatus}</span>}
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={handleExport}>
                  Generate Export
                </CyberButton>
                <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={handleCopy} disabled={!exportText}>
                  Copy
                </CyberButton>
              </div>
              {copyStatus && <span className="font-body text-xs text-white/50">{copyStatus}</span>}
              <textarea
                readOnly
                value={exportText}
                rows={12}
                placeholder="Click Generate Export to produce JSON for this map."
                className="w-full border border-white/10 bg-black/50 p-2 font-mono text-[0.65rem] text-white/80 outline-none"
              />
            </>
          )}
        </div>
      </div>

      <datalist id="map-builder-bg-ids">
        {BACKGROUND_IDS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <datalist id="map-builder-npc-ids">
        {NPC_IDS.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="map-builder-location-ids">
        {LOCATION_IDS.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
    </div>
  )
}
