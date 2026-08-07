# Case 1 Implementation Spec

*Working implementation spec for turning the Aveline breakout story into repo work. This is a production-planning document, not final canon.*

## Goal

Translate the current narrative direction for Case 1 into concrete game-facing work:

- locations and overworld structure
- cast and content modules
- Ink story files and route structure
- evidence / casefile requirements
- art / audio needs
- system gaps that must be filled before the story can ship

This spec assumes the current placeholder location chain (`checkpoint`, `noodleStall`, `deltaSquat`) will be replaced or heavily reworked into a real District 1 / 4 / 5 / 2 investigation flow.

## Narrative target

Case 1 is a slow-burn noir investigation centered on a false Aveline burglary report that is actually cover for a containment breach and escaped experimental subject.

The case should:

- introduce Saigon SEZ as a place, not just a plot backdrop
- let the player move through several districts while following breadcrumbs
- gate the deepest truth behind earned leverage and city knowledge
- keep body horror intimate and tragic
- keep HN-12 human, even when dangerous
- support optional side encounters, favors, and recurring characters around the main case

## District / overworld plan

The main story should be built around four districts:

- **District 4**: Aveline lab, flood wall, first police call, later public violence
- **District 1**: CID / SEZAC / official pressure / corporate-facing bureaucracy
- **District 5 (Cholon)**: gray clinics, informants, forged papers, former employees, layered community life
- **District 2**: sacrificed flood zone, final pursuit space, HN-12 confrontation

### Overworld direction

The current Overworld card grid is a workable temporary shell, but Case 1 needs a more specific Saigon-facing presentation.

Minimum requirement:

- Replace generic location cards with a **Saigon 2226 district map** or a **district hotspot board** that clearly shows Districts 1, 4, 5, and 2 as explorable areas.
- Each district should have a short identity blurb and a clear visual mood.
- The map should communicate defended core vs. sacrificed zones.
- District 2 should visibly read as outside the safe city logic.

Preferred direction:

- A stylized top-down or oblique schematic of Saigon SEZ in 2226.
- Districts as major nodes, with optional sublocations unlocked inside them.
- Visual emphasis on river, flood walls, elevated safe core, and drowned sacrificed edges.

### Overworld scope decision

We should decide early whether Case 1 uses:

1. **District-level nodes only**
Each district is one location and individual scenes are handled within its Ink file.

2. **District + sublocation nodes**
Districts are macro hubs, with smaller hotspots inside them such as Aveline Lab, CID offices, Cholon clinic, transit block, floodwall breach, drowned tower shell, etc.

Recommendation:

Start with **district-level nodes plus a small number of unlockable sublocations**. That gives us a more open-world feel without exploding file count too early.

## Required story locations

These are the likely main-story locations we need represented in code/content.

### District 4

- Aveline District 4 Laboratory
- Flood-wall service roads / perimeter
- First public incident scene
- Optional nearby worker housing / supply row

### District 1

- CID office / administrative base
- SEZAC records or licensing office
- Corporate-facing plaza or transit point
- Optional upscale social space for interviews / pressure scenes

### District 5 (Cholon)

- Gray clinic
- Informant market street / tea house / noodle house equivalent
- Former employee safe flat or tenement
- Paper-forging or records intermediary

### District 2

- Flooded access route
- Abandoned platform / tower shell
- Reclaimed marsh edge or service tunnel
- Final HN-12 encounter space

## File impact: content modules

### `src/content/locations.ts`

Needs a full rewrite away from placeholders.

Required updates:

- Replace placeholder `LocationId` union with real Case 1 locations.
- Add names / blurbs reflecting District 1, 4, 5, 2 identities.
- Add unlock flow appropriate to a breadcrumb investigation instead of a linear three-stop demo.
- Add baseline music / ambience for each district or sublocation.

Open design question:

- whether `LocationId` should represent only top-level districts or every sublocation

### `src/content/locationStories.ts`

Needs to map each playable location or district to its compiled Ink JSON.

If we choose district-level story files, this stays compact.
If we choose sublocation-level files, this grows quickly and should be kept organized.

### `src/content/npcs.ts`

Needs expansion from one NPC to a real case cast.

Likely required entries:

- `meiHong`
- Aveline project director
- Aveline security liaison
- compliance officer
- former Aveline employee
- Nusantara intermediary / enforcer
- CID superior or coworker
- Cholon informant
- HN-12, if shown as a tagged speaker during lucid moments

Each needs:

- display name
- portrait path
- possible future metadata if we want faction / district tags later

### `src/content/backgrounds.ts`

Needs expansion beyond the current three entries.

Required backgrounds likely include:

- Aveline lab exterior
- Aveline inner containment corridor
- District 4 flood wall
- District 1 CID / SEZAC interior
- Cholon street / clinic
- District 2 drowned ruins
- final encounter environment

### `src/content/casefile.ts`

Needs replacement of placeholder evidence and notes with Case 1 material.

Required content types:

- real evidence items for the Aveline / Nusantara trail
- notes tied to districts, witnesses, project history, and HN-series clues
- likely future support for hidden / unlocked evidence rather than static always-visible lists

Important:

The current static casefile content is not enough for this case. We likely need a real casefile progression system before Case 1 can land properly.

## File impact: Ink content

### `content/ink/intro.ink`

Already points in the right direction and should remain the opening handoff into Case 1.

Likely updates:

- refine Mei Hong's setup once the deeper case facts are finalized
- ensure intro foreshadows official-channel weirdness and Aveline panic

### New / revised Ink story files

We will need a set of real story files for the investigation.

Minimum likely set if using district-level structure:

- `district4.ink`
- `district1.ink`
- `cholon.ink` or `district5.ink`
- `district2.ink`

Possible additional files if using sublocations:

- `avelineLab.ink`
- `cidOffice.ink`
- `sezacRecords.ink`
- `grayClinic.ink`
- `formerEmployeeFlat.ink`
- `drownedTower.ink`

Story requirement:

These files cannot just be isolated scenes. They need to preserve the sense of an ongoing investigation, with clues found in one area unlocking options or truths elsewhere.

## File impact: stores / systems

### `src/stores/navigationStore.ts`

Current store shape can probably survive, but the unlock model may need to become less linear.

Potential needs:

- unlock multiple destinations in parallel
- optional sublocations inside a district
- revisit support that feels natural in an investigation rather than one-and-done scene hopping

### `src/stores/storyStore.ts` and `src/engine/storyEngine.ts`

May need new story-side actions if we want Case 1 to feel fully supported.

Possible additions:

- evidence acquisition from Ink
- case note acquisition from Ink
- location unlock triggers from Ink or a clean TS seam reacting to scene completion
- witness / investigation flags that can gate later dialogue

### `src/content/casefile.ts` plus new casefile progression store

Strong recommendation:

Add a real casefile progression layer instead of keeping the overlay static.

Likely need:

- owned evidence set
- unlocked notes set
- optional ordering / categories
- save/load integration

Without this, the investigation will feel fake because the player cannot materially build the case.

### `src/stores/saveStore.ts` / save blob

If casefile progression becomes real, save data must include:

- acquired evidence
- unlocked notes
- any investigation flags that are not already preserved in Ink state alone

## Art / asset requirements

### Overworld map asset

Required:

- a dedicated visual for Saigon 2226 overworld navigation

Could be delivered as:

- one illustrated map background plus hotspot coordinates
- one SVG / image map with district overlays
- one stylized district board if full map art is too early

### Portraits

Required for core cast:

- Mei Hong
- Aveline director
- security liaison
- Nusantara intermediary
- CID contact
- Cholon contact
- HN-12 if the final encounter uses portrait language rather than environmental-only horror

### Background art

Need at least a basic set covering the main districts and key interiors, even if some ship as placeholders first.

### Audio

Need district moods for:

- District 4 industrial rain / wall infrastructure
- District 1 climate-controlled corporate core
- Cholon crowd / market / interior murmur
- District 2 drowned-zone exposure / wind / pumps / water

Voice can remain minimal for now. No need to block narrative design on full VO.

## Open-world support requirements

Because the game is intended to feel open-world, Case 1 should not be implemented as four linear cutscenes.

Minimum support needed:

- several optional conversations per district
- at least a few side interactions that do not directly advance the plot
- recurring NPCs whose attitude can change over time
- clues that can be found in more than one order
- return visits to earlier districts that produce new outcomes once the player knows more

This does not require a huge simulation layer yet. It does require content structure that supports partial freedom.

## Proposed file additions

Likely docs and content additions:

- `docs/lore/Locations/District 1.md`
- `docs/lore/Locations/District 2.md`
- `docs/lore/Locations/District 4.md`
- `docs/lore/Cases/Case 1 cast notes.md`
- `content/ink/district1.ink`
- `content/ink/district4.ink`
- `content/ink/district5.ink`
- `content/ink/district2.ink`

Possible code additions:

- `src/stores/casefileStore.ts`
- `src/stores/casefileStore.test.ts`
- `src/engine/casefileEngine.ts`
- `src/engine/casefileEngine.test.ts`

Whether we need both a store and engine depends on how much logic sits behind evidence / notes / clue state.

## Recommended implementation phases

### Phase 1 - Spec and content shape

- finalize district list and location granularity
- lock main cast list
- define evidence / note list for Case 1
- decide whether HN-12 is a speaking tagged NPC in content terms

### Phase 2 - System support

- implement real casefile progression
- expand location model if district + sublocation navigation is chosen
- update save/load for new progression state

### Phase 3 - Overworld presentation

- create Saigon 2226 overworld spec
- implement district map or hotspot board UI
- wire new location content into navigation

### Phase 4 - Narrative content

- rewrite placeholder locations
- write district story files
- connect clue flow and unlock logic
- seed optional side interactions

### Phase 5 - Art and polish

- portraits
- backgrounds
- map art
- ambience / music pass

## Immediate next deliverables

The highest-value next specs are:

1. **Saigon 2226 Overworld Spec**
Defines map look, district presentation, hotspot logic, and unlock UX.

2. **Case 1 Cast Spec**
Defines named characters, roles, visual direction, and faction ties.

3. **Casefile Progression Spec**
Defines how evidence and notes are earned, stored, shown, and saved.

4. **Location Matrix**
Defines each district / sublocation, purpose, story beats, and required art / ambience.

## Recommendation

Do **not** jump straight from story bible into Ink writing.

The next logical move is to spec:

- the overworld map structure
- the playable location list
- the cast list
- the casefile progression system

Once those are locked, the actual scene-writing work will be much cleaner and we will avoid writing story files against placeholder architecture that we already know will change.
