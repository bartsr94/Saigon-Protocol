# Saigon Protocol — Design Document

*Setting: Sol system, mid-2220s. A narrative-driven detective RPG (browser-based, TypeScript) in the vein of Disco Elysium and Celestial Return: text-forward, choice- and dice-check-driven, with a personality-lens "Insight" system in place of a traditional stat block. World built by extrapolating real-world 2026 trends roughly 200 years forward.*

---

## 1. Premise & Tone

### Elevator Pitch

Two centuries of unchecked corporate capture, climate collapse, and great-power competition have reshaped Earth and its solar neighborhood into something recognizable but broken. Nation-states have hollowed out or fused with the corporations that used to merely lobby them. Earth's climate tipped past the point of return decades ago. Humanity adapted — genetically, technologically, and by leaving. The player starts in **Saigon Special Economic Zone**, a heavily engineered fortress-city on the edge of a drowned delta, working for (or around) one of the conglomerates still fighting for a foothold in a resource-rich, geopolitically contested region.

### Setting Snapshot

- **When:** ~2226 (roughly 200 years past our present)
- **Where to start:** Saigon SEZ and its hinterlands (Indochina), with the wider Sol system open for later expansion
- **Earth population:** ~5 billion, down from ~8 billion — decline driven by climate stress, off-world emigration, and falling birth rates in the hardest-hit regions
- **Off-world population:** ~1 billion, scattered across orbital stations, the Moon, Mars, and belt/outpost settlements — largely the descendants of climate evacuees rather than volunteer pioneers

### Core Themes (each extrapolated from a real, currently-observable trend)

1. **Corporate-State Fusion.** In the high-tech centers of North America, Europe, and East Asia, the line between "corporation" and "government" has effectively disappeared — corpo-govs administer territory directly. Low-tech and resource-poor regions pushed back or were simply left behind, for reasons as varied as ideology, faith, or principled rejection of oversight altogether.
2. **Hothouse Earth.** Global warming blew past 2°C. Large stretches of the planet are uninhabitable to unmodified humans. Corpo-govs have carved out safe-haven cities in the areas climate change hit last and hit slowest.
3. **Adapted Humanity.** Genetic modification for heat and environmental tolerance started small — targeted gene therapy, not unlike real treatments for sickle-cell anemia — and snowballed: animal and insect genes grafted in for extreme tolerance, then fully custom genomes bearing no relation to anything that came before. It's now closer to a norm than a novelty, though how modified any given person is varies enormously.
4. **The Off-World Exodus.** Roughly a billion people were evacuated from regions that even modification couldn't save. It was framed as a mercy and functioned, for many, as a one-way door — get people's numbers off Earth's books, whatever waits for them on arrival. Adaptation tech has since advanced to the point that no region is unlivable anymore, but the exodus already happened and left both Earth and the off-world colonies permanently reshaped.
5. **Privatized Force.** As governments weakened, PMCs filled the gap. Most are extensions of a specific corporation's will — a private army in service to its parent — but a large freelance market exists too, selling to whoever's paying. Metal Gear Solid is a fair tonal reference point.
6. **Automation's Uneven Mercy.** AI and robotics didn't eliminate labor so much as relocate it. Automated harvesters and factories still need humans to guard them from the environment and from desperate people; medical AI keeps more people alive, which means more hands are needed to mine the materials that build the next generation of robots. Some enclaves run on 90% automation and something close to comfort. Others still do almost everything by hand. Most places are somewhere in between.

### Regional Picture (Indochina, our starting theater)

- **Saigon SEZ** — formerly Ho Chi Minh City, briefly Ho Chi Minh City again, now rebranded back to *Saigon* under its new administration. Run by a consortium with one dominant Japanese/Korean megacorp at its center, organized explicitly as a free-trade zone to revitalize the region — with US and EU corporate money also holding stakes, a legacy of the old Vietnamese government inviting in anyone willing to help in a last-ditch effort against climate collapse. Built and continuously re-engineered against subsidence and flooding — sea walls, elevated districts, constant pumping — because the ground under it has been trying to drown the city since long before the 2220s.
- **The North** — Chinese-administered in all but name. Home to the region's richest rare-earth deposits, which the South desperately needs for its semiconductor and robotics industries. This dependency is the central economic tension of the region: the ore the South needs to build anything sits on the other side of a hostile border.
- **The drowned Delta** — what's left of the old Mekong Delta, mostly submerged, partially reclaimed as engineered wetland. Home to squatters, salvagers, and illegal fishing in altered waters.
- **Laos–Cambodia borderlands** — a live smuggling corridor (ore, refined material, people) and a spillover conflict zone, where PMCs, resistance factions, and opportunists all take their cut.
- **Thai–Cambodian frontier** — a longstanding great-power proxy battleground, now a black-market/PMC frontier running on "gray capital."
- **Myanmar highlands** — home to resistance movements with real roots — some Chinese-backed, some not, some the ideological descendants of factions that were already fighting central authority for generations before any corpo-gov arrived.
- **Rural holdouts everywhere** — people who didn't want to leave when the cities absorbed everyone else, eking out a living, and armed enough that nobody bothers them lightly. Not a monolith: some are just trying to survive, some are active resistance, some work with whoever pays.
- **The South China Sea** — contested oil, gas, and fishing grounds just offshore, with a real history of naval confrontation between claimants. Ongoing low-grade flashpoint.

### Tone & Influences

- Grounded speculative extrapolation, not neon pulp pastiche — the tech and politics should feel like a plausible "what if this kept going," not a genre costume.
- PMC/mercenary texture in the vein of *Metal Gear Solid*: professional, morally compromised, embedded in corporate politics rather than cartoonish.
- No clean good guys. Corpo-govs, resistance movements, and freelancers all have legitimate grievances and genuine blood on their hands.
- Start **adjacent** to the extremes, not inside them — Saigon SEZ is strained and unequal, not a hellscape, and not a utopia either. The wasteland, the warzone, the corporate boardroom, and the off-world colony are all a trip away, not the starting point.

### The Central Tension

Every major faction in the region needs something only the others can provide: the South needs the North's rare earths, the North needs the South's processing capacity and foreign capital, the resistance needs weapons and territory the corpo-govs can supply or deny, and the PMCs need conflict — anyone's conflict — to stay in business. Nobody involved can afford to let anyone else win outright. That standing deadlock, not a single villain, is the engine that should generate most of the campaign's stories.

### What This Setting Is Not

- **Not post-apocalyptic.** Civilization didn't collapse — it adapted, stratified, and kept running, unevenly.
- **Not solarpunk utopia.** Genuine progress (genetic adaptation, off-world settlement, automation) exists, but it's distributed as unequally as everything else, and it created new problems as fast as it solved old ones.
- **Not a single global dystopia.** Conditions vary wildly by region and by how much a given corpo-gov actually cares about the people under it. Saigon SEZ is not the whole world's story.

---

## 2. Player Premise & Story Hook

The player is a **police detective in Saigon SEZ**, assigned to a case that looks routine and quietly unravels into something far larger as the story progresses. The detective framing is deliberate: it gives the player a legitimate reason to move between every stratum of the setting — corporate districts, drowned Delta squats, gray-capital markets, the edges of the resistance — asking questions nobody wants answered. The innocuous-case-that-goes-off-the-rails structure keeps early play grounded and comprehensible while leaving the door open to the larger regional and (eventually) off-world stakes we've built.

Tone target: grounded neo-noir. The detective is a person with a history and a specific way of seeing the world (see Insights and Character Creation below), not a blank cipher. Failure is a path, not a wall — a botched check or a low stat opens rougher routes through the story rather than stopping it dead.

---

## 3. Core Mechanics: Insights & Resolution

### Insights (the personality-lens system)

In place of a traditional attribute/skill sheet, the detective's psyche is modeled as a set of **Insights** — personified internal voices that interject during play, color the narration, gate or unlock dialogue options, and provide the modifier for dice checks. This is the Disco Elysium / Celestial Return lineage, but the specific set is tailored to Saigon Protocol's themes:

- **The Ledger** — cold corporate transactional logic. Cost-benefit, contracts, leverage, what a thing is really worth. Strong at negotiation, spotting a corporate trap, appraising a deal.
- **The Graft** — the voice of an altered body. Adaptation, pain tolerance, kinship with the modified and unease around the unmodified. Colors anything involving genetic mods, cybernetics, or bodily extremity.
- **Muscle Memory** — professional violence worn smooth by repetition. Threat assessment, tactical reads, not flinching — and not romanticizing it either. The PMC-honed instinct.
- **Root** — homesickness and cultural memory. Grief for what's underwater, code-switching between corpo boardrooms and back-alley Vietnamese, empathy for the displaced.
- **Static** — low-grade climate dread as a running internal channel. Notices environmental danger early, carries the exhausted fatalism of someone who's watched the world decline in slow motion.
- **The Hustle** — scarcity-honed street cunning. Haggling, reading desperation, improvising without the right tools or leverage.
- **The Mask** — the social-chameleon instinct. Knowing which face to wear for which faction, and clocking when someone's doing the same to you.

Each Insight is both a *modifier source* (feeds dice checks) and a *narrative voice* (interjects in dialogue, unlocks flavor and special options). Insights are levelable over the course of the story.

*Open sub-question flagged for later: exact starting range and level cap per Insight — deferred to the mechanics-tuning pass, since it depends on how many checks a typical playthrough contains.*

### Resolution (Disco Elysium–style dice)

- **Core roll:** 2d6 + relevant Insight modifier vs. a target number set by difficulty. Dice are always available — there is **no consumable dice currency** (a deliberate departure from Celestial Return). Tension comes from modifiers and stakes, not from rationing dice.
- **Doubles are decisive:** a natural 12 (double sixes) always succeeds regardless of modifiers; a natural 2 (double ones) always fails regardless of modifiers. Every check stays live even at extreme modifier gaps.
- **White checks vs. Red checks:**
  - *White checks* are retriable — you can attempt them again once something in the world changes (an Insight levels up, new information surfaces, gear or context changes). This avoids hard dead-ends.
  - *Red checks* are one-shot, plot-critical, and never retriable. The game signals clearly before you commit. This is where irreversible tension lives — the replacement for dice-scarcity pressure.

The failure philosophy across both types: a failed check should branch the narrative toward a rougher, more costly path, not halt progress. Getting it wrong is content, not a game-over.

### Wellbeing & Damage (Composure & Vitality)

The detective is vulnerable in conversation, not just in danger — a Disco Elysium–style model where dialogue and events can wound you, and enough damage kills you. Two tracks:

- **Vitality** — physical wellbeing. Drained by injury, environmental exposure (the climate is a real hazard here), physical confrontation, some failed checks.
- **Composure** — psychological wellbeing. Drained by dread, grief, social devastation, a truth you didn't want, a botched high-stakes moment. This is where the setting's themes bite: an unmodified detective standing in a Delta squat, or hearing what emigration really means, can take Composure damage as surely as a knife takes Vitality.

**Rules of the model:**
- Both are **small-number pools** (single digits, Disco-style — not big HP bars), so any single hit feels significant and the player tracks them closely.
- **Damage comes primarily from narrative** — dialogue outcomes, event beats, and failed checks (especially Red checks, which can hit hard precisely because they're irreversible). This makes conversation genuinely dangerous.
- **Reaching zero in either track is a fail-state (death/breaking).** Vitality-zero is death; Composure-zero is a psychological break that ends the run. Both are game-over conditions — the player must manage two ways to lose, not one.
- **Recovery exists but is deliberate, not automatic** — specific narrative moments, rest, consumables/treatment, or resolving the thing that's hurting you. No passive regen that would defang the tension. (Exact recovery sources and rates: tuning-pass item.)
- **Max pool size may be tied to Insights** — e.g. physically-oriented Insights (Muscle Memory, The Graft) raising Vitality's ceiling, mentally-oriented ones raising Composure's. This reinforces build consequences: a cerebral detective is physically fragile and vice versa. *Exact Insight→track mapping and base values deferred to the tuning pass.*

**Design intent:** because damage flows through dialogue, the writing carries the threat. A conversation can be a boss fight. This also gives low-Insight builds a sharper edge — the rougher branches that open when you fail or lack an Insight often cost wellbeing, so a lopsided character doesn't just get different scenes, they get more dangerous ones.

*Open sub-question flagged for the tuning pass: base pool sizes, the Insight→max-pool mapping, and the full list of recovery sources — all depend on playthrough length and encounter density.*

---

## 4. Character Creation

A short, flavor-forward creation step (Disco Elysium's archetype-plus-points model), not a full lifepath simulation.

**Flow:**
1. **Pick a Cop archetype** — sets a baseline distribution across the seven Insights, with a couple pushed high and at least one pushed low as a genuine cost (not just flavor).
2. **Spend a small pool of free points** to personalize on top of the baseline.
3. **Receive a backstory blurb** tied to the archetype, which can unlock a handful of flavor-only recognition tags later (e.g. an ex-PMC being recognized by other PMCs).

**Archetypes** (each names a strength and an honest cost):

- **The Enforcer** — high Muscle Memory, low Ledger. Ex-PMC contractor turned SEZ police. Bulldozes situations a smarter cop would talk through; bad at negotiation and fine print.
- **The Company Man** — high Ledger, low Root. Transferred from corporate internal security. Reads leverage instinctively, numb to the human cost of what the SEZ runs on.
- **Old Saigon** — high Root, low Ledger. Local-born, maybe from a family that refused to leave. Deep cultural fluency and empathy; easy to outmaneuver in a boardroom.
- **The Wire** — high Graft, low Mask. Heavily modified by choice or necessity. Visceral insight into mods and cybernetics; can't blend in — the body gives them away.
- **The Hustler** — high Hustle, low Muscle Memory. Came up through the gray-capital economy. Reads desperation and improvises well; avoids violence and it shows when it can't be avoided.
- **Boring Cop** — flat, unremarkable spread with more free points to distribute. For players who want to build fully custom from a blank slate.

**Consequence design (the point of the low stats):** a weak Insight shouldn't only mean more failed checks — it should open *different* branches. A low-Ledger Enforcer finds the smooth negotiation option locked but a blunt-force option unlocked (intimidate instead of persuade), typically resolving the immediate problem while creating a new one downstream (a burned informant, a lieutenant who trusts you less). Weakness is a fork toward a rougher path, never a dead wall.

---

*Next section: Timeline Bridge — the key beats connecting 2026 to 2226, kept brief. (Still to be drafted.)*
