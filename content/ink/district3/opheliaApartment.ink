// Ophelia's Apartment (src/content/locations.ts, LocationId 'opheliaApartment')
// — a small District 3 rental she starts actually living out of once
// helping the detective with a stream makes staying findable worth the
// risk. Locked on the Overworld until turtleLakePlaza.ink's
// ophelia_stream_ask knot sets `ophelia-stream-agreed`
// (docs/OPHELIA_LIVESTREAM_ARC_SPEC.md) — content/locations.ts's
// `unlocksOnFlag` on turtleLakePlaza is what actually flips the District 3
// street POI open once that flag lands.

EXTERNAL adjust_affinity(npcId, amount)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL set_case_flag(flag)
EXTERNAL has_case_flag(flag)
EXTERNAL is_objective_complete(caseId, objectiveId)
EXTERNAL complete_case_objective(caseId, objectiveId)
EXTERNAL unlock_note(noteId)

VAR mask = 0
VAR ledger = 0
VAR hustle = 0
VAR affinity_ophelia = 0

// Gates checked in order, same convention as turtleLakePlaza.ink's
// ophelia_topics — the stream scene plays exactly once on first arrival,
// the escalation beat plays exactly once on the visit after that, and only
// once both are behind you does this settle into an ordinary repeat-topics
// loop.
=== ophelia_apartment_topics ===
{ not has_case_flag("ophelia-stream-scene-done"):
    -> ophelia_stream_scene
}
{ has_case_flag("ophelia-stream-scene-done") and not is_objective_complete("ophelia-stalker", "pattern"):
    -> ophelia_pattern_livestream
}
{ affinity_ophelia >= 3:
    Ophelia doesn't bother with the performance the second you're through the door — this room only has one audience worth managing, and it isn't you. "You're early. Or I'm behind. Pick whichever makes me sound less disorganized." # speaker: npc:ophelia
- else:
    Ophelia glances up from whatever she's doing to the ring light's angle and waves you further in without really looking. "Door's unlocked because I was expecting you, not because I've gotten careless." # speaker: npc:ophelia
}
* [The numbers, after # insight: ledger] "Did it actually help? The stream?"
    "Enough to matter. Not enough to fix anything permanently, which was never really the point, was it." She says it lightly, but doesn't quite meet your eyes doing it. "It bought me a month where I'm not doing the rent math at three in the morning. That's not nothing." # speaker: npc:ophelia
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_apartment_topics
* [Why here? # insight: root] "Why this place, specifically?"
    "Because it's mine. Because the landlord doesn't ask questions as long as the transfer clears. Because for the first time since I got here, somewhere with my actual address on it isn't a liability." She looks around the room like she's still getting used to that being true. "Don't get sentimental about it. It's a room." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_apartment_topics
* [Scared? # insight: static] "Does it worry you, him knowing you've got someone new around?"
    The brat drops out entirely, just for a second. "Every day. I don't say that out loud very often, so don't make a thing of it." She busies her hands with the ring light's stand, more for something to do than because it needs adjusting. "You're the first thing in a while that isn't purely a liability, and that terrifies me more than I want it to." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_apartment_topics
* { affinity_ophelia >= 5 } [Why you trust me # insight: mask] "You didn't have to let me in here. Why did you?"
    She's quiet a beat longer than the question should need. "Because everyone else who's ever been in this room paid to be here, one way or another. You didn't." A short, uncomfortable laugh. "I don't have a lot of practice with the other kind." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 2)
    -> ophelia_apartment_topics
+ [Head out.]
    "Lock it behind you," Ophelia says, already back to whatever she was doing before you arrived. "And thank you. I'm allotting myself one of those a week, so don't get used to it." # speaker: npc:ophelia
    -> END

// Scene 2 (docs/OPHELIA_LIVESTREAM_ARC_SPEC.md) — plays exactly once, the
// first time the detective walks in after agreeing to help.
=== ophelia_stream_scene ===
Her apartment is smaller than the persona and lit better than it has any right to be — a ring light, a rented-looking velvet backdrop doing its best to cover for the water stain behind it, a laptop propped on what might be the only sturdy furniture in the room. Ophelia's already in character: the online Ophelia, not the Turtle Lake one, mouth set in something more curated than her usual sharpness. # speaker: npc:ophelia # portrait: performing
"Stand there, don't look at the camera unless I tell you to, and for the love of God don't say your rank on mic." She's already counting down on her fingers. "We're live in ten." # speaker: npc:ophelia # portrait: performing
{ mask >= 3:
    Mask clocks the tell under the performance — she's rationing nerves the same way she rationed panic at the fountain, just dressed better this time. # speaker: insight:mask
}
* [Sell the bit. # check: red]
    ~ temp sellResult = roll_check("mask", 7, "ophelia-stream-sell-it", "red")
    { sellResult:
        You lean into it — clipped, unplaceable, exactly the kind of "off the record" a paid audience eats alive. Ophelia doesn't miss a beat, feeding you lines like she's done this with you a hundred times, and for a few minutes it's genuinely, uncomfortably fun. The numbers on her screen actually climb while you watch. # speaker: npc:ophelia # portrait: performing
        ~ adjust_affinity("ophelia", 2)
    - else:
        You are, it turns out, a terrible actor. Stiff, over-formal, visibly a man who has never once considered being charming for money. Ophelia covers for you smoothly enough that most of the audience reads it as bit — "he's new," she says, deadpan, "we're workshopping him" — and somehow that lands too. # speaker: npc:ophelia # portrait: performing
        ~ adjust_affinity("ophelia", 1)
    }
    ~ set_case_flag("ophelia-stream-scene-done")
    -> ophelia_stream_scene_wrap

=== ophelia_stream_scene_wrap ===
She cuts the feed a few minutes later, and the performance drops off her like a coat coming off. "Don't make this weird," she says, though she's smiling despite herself. "It's a favor. It is not a moment." She's already checking the numbers again, and doesn't quite manage to hide that she's pleased with them. # speaker: npc:ophelia
-> END

// Scene 3, agreed variant (docs/OPHELIA_LIVESTREAM_ARC_SPEC.md) — the visit
// after the stream, not the same one; the top-of-knot guard above only
// reaches this once ophelia-stream-scene-done is already set, which means
// the player left and came back.
=== ophelia_pattern_livestream ===
Ophelia's phone is already face-down on the counter when you walk in, which is its own answer. # background: opheliaApartment
"He watched. Of course he watched." She doesn't bother with the brat voice this time. "And he didn't just watch — he wanted to know who you were. Specifically. By name, by rank, by whether I'd 'moved on' to a badge instead of him." She sets the phone down harder than it needs. "That's not a fan reacting to content, Detective. That's someone keeping a file." # speaker: npc:ophelia # portrait: guarded
~ complete_case_objective("ophelia-stalker", "pattern")
~ unlock_note("note-06")
-> ophelia_apartment_topics

=== ophelia_apartment_corner ===
Up close the "set" is cheaper than it plays on camera — a backdrop clipped to a curtain rod, a ring light on a stand that's been glued back together at least once, a laptop with more browser tabs open than any one job should need.
{ ledger >= 3:
    The Ledger prices the whole setup at less than a week of what one good night probably brings in — everything here is built to look expensive on camera and cost as little as possible in the room. # speaker: insight:ledger
- else:
    It looks more expensive on a screen than it does standing this close to it.
}
{ hustle >= 3:
    Hustle clocks the folder of printed notes half-hidden under the laptop — audience names, spending patterns, the kind of tracking most performers do in their heads. She's running this like a real business, alone, without anyone to split the workload. # speaker: insight:hustle
- else:
    A folder of notes sits half-hidden under the laptop. You don't get a good look at what's in it.
}
* [Leave it alone.]
    -> ophelia_apartment_corner_done

=== ophelia_apartment_corner_done ===
-> END
