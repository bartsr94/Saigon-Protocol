# Off-World Propaganda Tier 1 Content Spec

*Working content spec for an ambient off-world-recruitment propaganda pass —
wall ads, transit-platform screens, and street-level messaging pushing
emigration to the Moon, Mars, and the Belt. Purely background dressing: no
off-world location will ever be visited, no new engine system is required.
This is a production-planning document, not final canon; sample ad copy
below is starter material for content authors to use or riff on, not locked
final prose.*

## Goal

The GDD already establishes that ~1 billion people live off-world, that the
original off-world exodus was climate evacuation dressed up as mercy, and
that adaptation tech has since advanced to the point that no region of
Earth is technically unlivable anymore (GDD §"The Off-World Exodus"). That
raises an obvious question a lived-in Saigon should answer without anyone
having to explain it: if nowhere on Earth is unlivable anymore, why is
recruitment propaganda still everywhere? This pass answers that visually
and texturally, using the same tools the Atmosphere Tier 1 pass used
(`ATMOSPHERE_TIER1_SPEC.md`) — ink content tags, per-location blurbs, and
Location Hub / District Street per-square description text — rather than
building a new system.

## The in-fiction logic

Recruitment propaganda outlived the exodus that justified it because the
underlying demand didn't go away — it changed shape. The Moon, Mars, and
Belt settlements are 200 years deep into their own labor economies now
(per the earlier off-world discussion in this project: Moon as stratified
and Earth-adjacent, Mars as the closest thing to an independent
nation-building project, the Belt/orbital stations as off-world's own
working class). All three still need bodies, and Earth — specifically a
labor pool as dense, displaced, and precarious as Saigon SEZ's — is the
obvious source. The ads aren't run by SEZAC (no budget, no reach) and
aren't a Compact vanity project; they're bought space, most plausibly
financed by off-world labor concerns or transit brokers with a standing
recruitment quota, running through the same commercial ad infrastructure
that sells anything else in the SEZ. Nobody in Saigon has to be told this;
it's wallpaper, the way real-world transit ads for predatory loans or
for-profit trade schools are wallpaper.

**The catch, per destination — this is what gives an otherwise-decorative
ad narrative teeth:**

- **Mars land grants** ("claim 1000 hectares — yours, guaranteed") — the
  land grant itself is real and unconditional. What the ad doesn't say:
  raw Martian acreage isn't habitable acreage, and turning a claim into
  somewhere you can actually live is a labor cost measured in years, not
  covered by the grant. Structurally a homestead-act play — technically
  honest, functionally a trap for anyone who reads "land" as "home."
- **Moon salaries** ("10x Earth wages, guaranteed contract") — the number
  is real. Silent on cost-of-living inside a sealed environment where
  every unit of air, water, and space is metered and billed, and on
  transit-debt garnishment eating the multiple down to something much
  closer to parity before a worker ever sees a full paycheck.
- **Belt / orbital station labor** — the least glamorous pitch and, not
  coincidentally, the most honest one: steady work, hazard pay, no
  land-grant or lifestyle fantasy attached. Worth keeping deliberately
  plain against the other two so its comparative honesty becomes its own
  quiet tell — nobody bothers lying about a mining job.

## Per-Insight reaction mapping

Following the Atmosphere Tier 1 pass's convention of assigning primary/
secondary Insights per content theme rather than re-deriving voice fit
per line:

| Insight | Role |
|---|---|
| **Ledger** | Primary. Does the math the ad is designed to discourage — debt-financed transit, real off-world cost-of-living, the quota economics behind why this ad exists at all. |
| **Hustle** | Primary. Recognizes the recruitment-pitch shape from its street-level cousins — a labor scam wearing a nicer suit. |
| **Static** | Secondary. Notices the ad's manipulative craft and placement itself — why animated, why wall-sized, why *here* (a checkpoint queue, a transit platform, anywhere captive attention gathers). |
| **Root** | Secondary. Grief angle — someone's cousin/parent/sibling actually took a contract, and what came back (or didn't). Strongest Composure-damage vector; pairs with an NPC who lived it, not the ad alone, per the GDD's existing "hearing what emigration really means" line. |
| **Mask** | Secondary. Reads the ad as craft — professional appreciation or contempt for the messaging itself, distinct from Hustle's cynicism about the scam underneath. |
| Muscle Memory, Graft | Not used for this pass. |

## Sample ad copy bank

Starter lines only — direction and tone, not locked copy. Each destination
keeps a consistent voice: upbeat, second-person, imperative, the register
of a transit ad or a for-profit trade-school billboard, never
self-aware about its own catch.

**Mars — land-grant pitch:**
- "1,000 HECTARES. YOUR NAME ON THE DEED. MARS IS STILL TAKING SIGNUPS."
- "Every acre of Earth has an owner already. Mars doesn't. Ask us how."
- "They can't build vertically fast enough for you here. Out there, you build outward. Forever."

**Moon — wage-multiplier pitch:**
- "LUNAR CONTRACT WAGES: UP TO 10X SAIGON SCALE. NO EXPERIENCE REQUIRED."
- "Every shift you work here, someone on the Moon is earning ten of you. Why not be the ten?"
- "Sign today, ship this quarter. Financing available for transit and orientation fees." *(the fine print doing a lot of quiet work)*

**Belt / orbital stations — plain-labor pitch:**
- "STATION HANDS WANTED. HAZARD PAY. FULL LIFE-SUPPORT COVERAGE, DAY ONE."
- "Steady work. Steady air. Steady pay. Sign at any transit kiosk."
- (Deliberately no land or lifestyle framing — the honesty is the point.)

**A recurring background sting** (useful for repetition across multiple
locations without feeling copy-pasted): a rotating tagline stinger that
appears under any of the above, e.g. *"EARTH IS HOME. THE FUTURE ISN'T
HERE ANYMORE."* — the kind of line that reads as inspirational until an
Insight interjection reframes it.

## Per-location placement

Using the current 9 `LocationId` entries (`src/content/locations.ts`) and
the two live District Street layers (`district4`, `district1`,
`src/content/districtStreets.ts`), matching Atmosphere Tier 1's
per-location table format:

| Location / street | District | Ad presence | Direction |
|---|---|---|---|
| `checkpoint` | 4 | High | A captive queue is exactly where a recruitment screen earns its wall space — Moon/Belt pitch, aimed at exactly the dockworker labor pool that'd plausibly sign. |
| `transitPlatform` | 4 | High | Transit infrastructure is the single most natural home for this content — literally a place people leave from. All three pitches plausible; good spot for the rotating tagline sting. |
| `district4` street POIs | 4 | Medium | One or two POI `description` beats — animated wall ad glimpsed in passing, distinct from the checkpoint/platform's captive-audience framing. |
| `corporatePlaza` | 1 | Medium, inverted tone | Ads here skew Mars-land-grant/aspirational rather than Moon-labor — sold as opportunity to people who don't need the wage multiplier, which is its own quiet class tell. |
| `district1` street POIs | 1 | Low | At most a background glimpse — District 1's ad register should read cleaner/more expensive than District 4's, consistent with `cidOffice`'s existing "hazard goes quiet" upper-tier treatment in Atmosphere Tier 1. |
| `workerCanteen` | 4 | Low, via dialogue not ad copy | Not a physical ad placement — better as a Root/Hustle interjection or NPC line about someone who took a contract, matching this doc's Root guidance above rather than another wall screen. |
| `sezacRecords` | 1 | None | SEZAC doesn't run or benefit from this messaging; a screen here would undercut the "not a government project" logic. |
| `noodleStall` | 5 (Cholon) | None | Cholon's texture is already carrying its own distinct threads (Bang communities, Compact–North suspicion); off-world recruitment ads would dilute rather than add. |
| `publicIncidentScene`, `deltaSquat` | 4, 2 | None | Scene focus (incident) or a different register entirely (sacrificed-district survival) — off-world recruitment framing doesn't fit either. |

## Implementation surface

No engine or schema changes. This is content only, following the exact
pattern Atmosphere Tier 1 used:

| File | Change |
|---|---|
| `src/content/locations.ts` | Extend `blurb` for `checkpoint`, `transitPlatform`, `corporatePlaza` with a one-line ad-presence beat, per the placement table above. |
| `content/ink/district4/checkpoint.ink`, `district4/transitPlatform.ink` | Add Ledger/Hustle (primary) and Static (secondary) interjection lines reacting to the ad content, following the Atmosphere Tier 1 pass's interjection pattern. |
| `content/ink/district4/workerCanteen.ink` | One Root-voiced line or NPC beat referencing a contract-taker, not ad copy — per the placement table's dialogue-not-signage note. |
| `src/content/districtStreets.ts` | Extend one or two `district4` POI `description` entries with a glimpsed-ad beat; at most one low-key `district1` POI entry. |

No new `AmbienceId`s are required for this pass — if a looping jingle/
announcement-loop layer is wanted later, it would follow the same
`AmbienceId` pattern Atmosphere Tier 1 used (e.g. a `transitAnnouncement`
loop), but that's an explicit future addition, not part of this scope.

## Open questions

- Should the rotating tagline sting ("EARTH IS HOME...") appear verbatim
  in multiple locations (deliberate repetition-as-worldbuilding, the way
  real transit systems repeat the same ad citywide), or should each
  location get unique copy?
- Is `corporatePlaza`'s inverted Mars-land-grant framing worth a distinct
  Insight interjection (e.g. a Ledger line making the class contrast
  explicit), or is the copy itself enough to carry it?
- Does this pass want a single recurring off-world "brand" name (a transit
  broker or labor concern identity tying all three destinations' ads
  together), or should the three pitches read as separate, uncoordinated
  advertisers to reinforce that off-world recruitment is a whole industry,
  not one company?
