// The Undercanopy (src/content/locations.ts, LocationId 'undercanopy') —
// District 3's fixer-run bar, per the vault's District 3 file's "Underside
// of the Canopy" section: a bar that's a front as often as it's actually a
// bar, where the district's informal economy of sublets, debts, and
// grey-market goods actually runs. Optional city-life location (same
// status as pasteurStreetTaproom.ink), not Case 1 content. Two POIs: the
// courier cubbies below, and Cò (talk).

EXTERNAL adjust_affinity(npcId, amount)

VAR ledger = 0
VAR hustle = 0
VAR static = 0
VAR mask = 0
VAR root = 0
VAR archetype = ""
VAR affinity_co_fixer = 0

=== undercanopy_courier_cubbies ===
A wall of numbered lockboxes runs the length of the back hall, no two the same make, none of them labeled with anything a stranger could read. People come in, check a number against something on their sleeve, open one, take something out or put something in, and leave without a word to anyone at the bar. One runner palms off a strip of stim tabs before he hits the stairs. Another carries an insulated case against his chest like it matters more than he does. # background: undercanopy
{ ledger >= 3:
    The Ledger doesn't need to see what's inside any of them to read the system — a consignment economy running on numbers instead of names, so nobody involved ever has to know who else is involved. Pills, graft parts, off-book cash, maybe cooled organs if the fees clear high enough. Every vice in the district likes anonymous inventory. # speaker: insight:ledger
- else:
    Some kind of drop-box system. You don't follow exactly how it works.
}
{ hustle >= 3:
    Hustle reads the traffic pattern before anything else — steady, unhurried, nobody checking over a shoulder on the way out. Whatever moves through this wall, it's been moving through it long enough that fear stopped being part of the routine. That's what bad things look like once a neighborhood has had time to normalize them. # speaker: insight:hustle
- else:
    Nobody seems especially nervous about any of this.
}
{ static >= 3:
    Static clocks the wiring running to each box before it clocks anything else — a cheap, deliberate short-circuit rig, wired to scramble whatever's inside the second anyone forces a box that isn't theirs. Whoever built this wall planned for exactly the wrong kind of visitor. # speaker: insight:static
- else:
    The boxes look ordinary enough. You don't clock anything unusual about them.
}
{ root >= 3:
    Root doesn't read the system, it reads what's underneath it — how many of these transactions are somebody's rent, somebody's medicine, somebody's only way to get paid for work that was never going to show up on a payslip, somebody's body sold off a piece at a time because the district stopped offering better options years ago. This isn't crime for its own sake. It's a district doing the math on how to survive a landlord who's never coming home. # speaker: insight:root
- else:
    Whatever's changing hands, it's not your business to guess at.
}

* [Take it in and get back to the bar.]
    -> undercanopy_courier_cubbies_done

== undercanopy_courier_cubbies_done ==
-> END

=== co_fixer_intro ===
The bar's real business happens at a corner booth, not behind the counter — a small, unhurried man everyone just calls Cò, a name that means "broker" in every sense that matters and nothing else on any registry. He doesn't stand when you approach. He doesn't need to. # speaker: npc:coFixer # background: undercanopy
"A badge, in my booth." He says it flat, not quite a question. "Sit if you're buying a drink. Talk if you're buying something else. Either way, I already know you're not paying for information for free." # speaker: npc:coFixer
-> END

=== co_fixer_topics ===
{ affinity_co_fixer >= 5:
    Cò gestures at the seat across from him without looking up. "Detective. You're becoming a regular. That's either good for business or very bad for mine." # speaker: npc:coFixer
- else:
    Cò keeps his eyes on the room, not on you. "Still here. Make it worth the seat you're taking up." # speaker: npc:coFixer
}
* [Ask what he actually brokers. # insight: ledger]
    "Rooms nobody official can rent you, mostly. A landlord's never coming back, a tenant needs somewhere to put a bed, I make sure the two arrangements never have to meet each other in person. Everybody pays. Nobody signs anything." # speaker: npc:coFixer
    ~ adjust_affinity("coFixer", 1)
    -> co_fixer_topics
* [Ask what else moves through here besides rooms. # insight: hustle]
    "Whatever needs to move through a district nobody official is watching. Parts. Pharma nobody's filed a prescription for. Narco dust. Anti-rejection ampoules. Sometimes a wet-ice courier box nobody sensible opens on my table." He shrugs. "And sometimes people sell hours of themselves the same way they sell anything else — quietly, in cash, before rent comes due." # speaker: npc:coFixer # portrait: guarded
    ~ adjust_affinity("coFixer", 1)
    -> co_fixer_topics
* [Ask if SEZAC's ever going to be a problem for this place. # insight: static]
    "SEZAC doesn't budget patrols for a district with no cargo throat and no research contract. That's not luck, Detective, that's the entire business model. The day this district starts mattering to somebody upstairs is the day I close this booth and open a different one." # speaker: npc:coFixer
    ~ adjust_affinity("coFixer", 1)
    -> co_fixer_topics
* [Ask why everyone just calls him Cò. # insight: mask]
    "Because it's not a name, it's a job description, and jobs don't get subpoenaed." A thin smile. "The Mask already worked that out before you asked. I can see it on you." # speaker: npc:coFixer
    ~ adjust_affinity("coFixer", 2)
    -> co_fixer_topics
* { archetype == "hustler" } [Ask him straight — how long before someone like you ends up running a booth like this.]
    Something in his face shifts, just slightly — recognition, not warmth. "You already know the answer, or you wouldn't have asked it that way." He lets that sit for a beat. "Long enough to hate it. Not long enough to find a cleaner trade." He doesn't say anything else on the subject, and you don't push it. # speaker: npc:coFixer
    ~ adjust_affinity("coFixer", 2)
    -> co_fixer_topics
+ [Leave the booth.]
    Cò doesn't watch you go — he's already back to whatever he was tracking on the room before you sat down. # speaker: npc:coFixer
    -> END
