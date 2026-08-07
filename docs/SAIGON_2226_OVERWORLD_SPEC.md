# Saigon 2226 Overworld Spec

*Working spec for replacing the current Overworld card grid with a clickable Saigon district map. This spec is implementation-facing and uses the current `saigon_map.jpg` as a temporary background asset.*

## Goal

Build the Overworld as a **map of Saigon** where the player can click a district to move into that district's story view.

This should:

- make the city feel like a place rather than a menu
- support the Case 1 investigation structure across Districts 1, 4, 5, and 2
- preserve room for future art replacement without changing the interaction model
- support an eventual open-world feel with district revisits, optional sublocations, and clue-driven unlocks

## Temporary art source

Use the current modern-day map image:

- `saigon_map.jpg`
- current dimensions: `2048 x 1280`

This asset is a **temporary interaction surface**, not final in-world art.

We should design the system so that:

- the temporary modern map can be used now
- a future 2226-stylized map can replace it later
- hotspot definitions survive the art swap with only coordinate tuning

## Core interaction model

### Player flow

1. The player opens the Overworld.
2. They see the Saigon map with district overlays.
3. Hovering or focusing a district highlights it and surfaces its label.
4. Clicking an unlocked district selects it.
5. Selection either:
   - enters the district directly, or
   - opens a district subpanel / sublocation list if that district has multiple active destinations.

Recommendation:

Use **district click -> district panel -> enter sublocation/story**.

That gives us a city-map feel while still supporting multiple destinations per district later.

## Districts in scope

Case 1 should focus on these four clickable districts:

- **District 1**
- **District 4**
- **District 5**
- **District 2**

### Case 1 district roles

- **District 4**: Aveline lab, flood wall, early incidents
- **District 1**: CID / SEZAC / official channels / pressure
- **District 5**: Cholon, informants, clinics, forged papers, former employees
- **District 2**: sacrificed and flooded zone, final pursuit and HN-12 confrontation

## UX structure

### Main layout

Keep the current left nav rail pattern.

Recommended screen structure:

- left: `NavRail`
- center/right: full map canvas area
- lower or side panel: district details, current objective, or sublocation list

### On-map district state

Each district should support these states:

- `locked`
- `unlocked`
- `current objective`
- `visited`
- `urgent`

Suggested behavior:

- `locked`: dimmed, no pointer interaction, label hidden or minimal
- `unlocked`: visible outline / glow on hover
- `current objective`: stronger pulse or secondary accent
- `visited`: subtle persistent tone so the city feels remembered
- `urgent`: warning accent used sparingly for time-sensitive beats

### District label behavior

On hover/focus/tap:

- show district number and common identity, e.g. `District 5 / Cholon`
- show one-sentence blurb
- show whether the district has active leads

### District panel behavior

After selecting a district, open a small panel with:

- district name
- district blurb
- current lead summary
- list of currently available sublocations or actions
- `Enter` button if we are routing directly to one story file

This panel lets us support open-world investigation structure without cluttering the map with too many separate hotspots too early.

## Data model recommendation

The current `LocationId` model should evolve toward a district-aware structure.

### Recommended shape

Keep hotspots and locations separate.

Example concept:

```ts
type DistrictId = 'district1' | 'district2' | 'district4' | 'district5'

interface DistrictMapRegion {
  id: DistrictId
  label: string
  shortName?: string
  polygon: Array<{ x: number; y: number }> // normalized 0..1
  labelAnchor: { x: number; y: number }    // normalized 0..1
}

interface LocationDefinition {
  id: LocationId
  districtId: DistrictId
  name: string
  blurb: string
  unlockedByDefault: boolean
  ...
}
```

Why:

- `DistrictId` powers the map
- `LocationId` powers story entry
- one district can contain several locations later without needing new map logic

### Coordinate format

Store hotspot coordinates as **normalized values** (`0..1`) rather than pixel positions.

Reason:

- works at any responsive size
- easier to reuse when future 2226 art replaces the current image
- only requires small tuning if aspect ratio stays similar

## Temporary hotspot plan

Because the current asset is a district map already, the clickable regions should match the existing district shapes as closely as practical.

For Phase 1, we do **not** need perfect polygon tracing by hand on day one.

### Recommended rollout

1. Start with rough polygon or simplified region shapes for Districts 1, 4, 5, and 2.
2. Verify clickability visually.
3. Tighten polygons once the interaction feels good.

### Important note on future art

When we replace the map with a 2226-styled version, district shapes may be altered to reflect:

- contracted defended core
- sacrificed Districts 2, 7, and 9
- flood-wall infrastructure
- changed river edge and reclaimed / drowned zones

That is acceptable as long as the district interaction contract remains the same.

## Suggested district presentation on the temporary map

### District 1

- highlight as the administrative and corporate core
- crisp cyan or cool-white accent
- label tone: official, insulated, high-status

### District 4

- highlight as rain-stained industrial edge against the wall
- more hazard-coded accent
- label tone: flood-wall pressure, Aveline presence, early violence

### District 5

- highlight as dense, warm, crowded, layered
- label should read `District 5 / Cholon`
- strongest sense of lived urban fabric

### District 2

- highlight as unstable or half-sacrificed
- should visually read less secure than the defended core
- when story time comes, this district should feel ominous even before entry

## Navigation behavior

### District selection

Clicking a district should not immediately load story content without context unless only one destination exists.

Preferred flow:

- click district
- show panel with available destinations
- player chooses where to go inside that district

### Sublication support

Even if Case 1 initially uses one playable story node per district, the UI should be built to support multiple destinations later, for example:

- District 4
  - Aveline Lab
  - Flood-wall incident site
- District 1
  - CID Office
  - SEZAC Records
- District 5
  - Gray Clinic
  - Informant Row
- District 2
  - Flooded Access Route
  - Drowned Tower

This keeps the map feeling like a world rather than a single list of scene cards.

## Objective surfacing

The map should help the player understand where leads are without over-solving the investigation.

Recommended signals:

- district glow for areas with active leads
- district panel summary such as `2 active leads`
- optional short objective text below the map

Avoid:

- explicit giant quest markers on every hotspot
- turning the city map into a checklist UI

We want directional guidance, not loss of mystery.

## Responsive behavior

### Desktop

- full-width map
- hover highlight
- label anchor popups
- right or bottom info panel

### Mobile / narrow screens

- tap to select district
- second tap or panel button to enter
- panel should slide up from bottom

Because polygon interactions can be fiddly on small screens, label anchors and panel confirmation become more important there.

## Accessibility

The map must not be hover-only.

Required:

- keyboard focusable district regions
- visible focus ring / outline
- district list fallback panel for screen-reader and keyboard users
- district names and states exposed as text

Recommended fallback:

Below or beside the map, include a text list of available districts mirroring the hotspot state. This also gives us a cheap rescue path if precise clicking on the temporary map feels rough.

## Current repo impact

### `src/components/screens/OverworldScreen.tsx`

Will need to be rewritten from grid-of-cards to:

- map background image
- SVG or positioned overlay for district regions
- district state and selection UI
- district panel / sublocation panel

### `src/content/locations.ts`

Should stop being only the view model for card rendering.

Needs:

- district association for each playable location
- more realistic Case 1 district/location list

### New content module recommendation

Add a dedicated map-region module, e.g.:

- `src/content/mapRegions.ts`

Suggested responsibilities:

- define district hotspot regions
- define district labels and anchors
- separate map geometry from location/story metadata

This keeps `locations.ts` focused on story destinations rather than screen geometry.

## Temporary implementation strategy

### Phase 1

- use `saigon_map.jpg` as the map background
- implement four clickable district regions
- route each district to a simple panel
- keep a text fallback list

### Phase 2

- add district-specific labels and map highlighting
- support multiple sublocations per district
- surface active leads / urgency on the map

### Phase 3

- replace modern map with stylized 2226 art
- retune hotspot coordinates
- add sacrificed-zone visual treatment and future-world overlays

## Recommended immediate file additions

- `src/content/mapRegions.ts`
- optional test file for geometry helpers if we add any

No geometry-heavy engine layer is required unless we start doing advanced hit testing. SVG polygons are likely enough.

## Implementation recommendation

Use an **SVG overlay** on top of the background image.

Reason:

- easiest way to define clickable district polygons
- easy hover/focus styling
- accessible with proper `button` or interactive group semantics
- easier to iterate than manual absolute-position hitboxes

Recommended structure:

- map container with background image
- absolutely positioned SVG with one polygon per district
- district labels rendered from normalized anchor coordinates
- side/bottom panel for district details

## Open questions

- Should District 2 be unavailable at first and only visibly unlock later, or visible-but-restricted from the start?
- Do we want one story file per district first, or one story file per sublocation from the beginning?
- Should the map show district names at all times, or only on interaction?
- How much of the modern map labeling should be visually suppressed by the UI layer while it remains a placeholder?

## Recommendation

Implement the Overworld around **clickable districts on the provided map now**.

Do not wait for final 2226 art.

The correct abstraction is:

- temporary background image
- stable district hotspot model
- district selection panel
- future art swap later

That gives us real progress immediately and keeps the narrative, navigation, and open-world structure moving forward.
