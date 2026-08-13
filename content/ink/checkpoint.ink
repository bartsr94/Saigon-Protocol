// SEZ Checkpoint (src/content/locations.ts) — flavor-light placeholder scene,
// not real GDD content (docs/GAME_GUIDE.md). Exercises a Red
// check inline, per this location's own content.

EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL gain_evidence(id)
EXTERNAL unlock_note(id)
EXTERNAL unlock_thought(id)
EXTERNAL has_thought(id)
EXTERNAL adjust_affinity(npcId, amount)

VAR hustle = 0
VAR static = 0
VAR graft = 0
VAR ledger = 0
VAR affinity_lakshmi_avani = 0

The checkpoint queue barely moves. A bored guard waves cars through two at a time, more interested in his handheld than your badge.
{ hustle >= 3:
    The Hustle reads the guard's boredom as an opening — a story here could shave ten minutes off the wait. # speaker: insight:hustle
- else:
    You settle in for the wait like everyone else.
}

A mask-seal scanner and a ration-chit reader are bolted to the same post, badge check third in line. Nobody questions the order anymore.
{ static >= 3:
    Static clocks the scanner's little particulate readout ticking up before you even reach it — another bad-air day nobody's bothering to announce. # speaker: insight:static
- else:
    Just routine hardware, as far as you can tell.
}

A woman in Aveline colors clears the same post without slowing down — no mask-seal check, just a nod from the guard.
{ graft >= 3:
    Graft doesn't need the badge to place her — subdermal ports at the collar, skin that's never once burned under unfiltered sun. Whatever's sealed off past this checkpoint, she's not the kind of modified that queues for anything. # speaker: insight:graft
- else:
    Just someone who didn't have to wait, as far as you can tell.
}

Above the queue, a recruitment screen loops Terra Nova's pitch on a three-second cycle — lunar wage figures scrolling past the mask-seal readouts like just more processing data. EARTH IS HOME. THE FUTURE ISN'T HERE ANYMORE, it finishes, then starts again.
{ ledger >= 3:
    The Ledger's already subtracting before the loop resets — full board, filtered air, and a transit debt eating that multiple down to something a lot closer to Saigon scale. # speaker: insight:ledger
- else:
    Big numbers. Gone before you can read whatever's printed underneath them.
}

{ is_red_check_consumed("checkpoint-jump-queue"):
    You already tried that trick once today. Better not push it twice.
    -> done
- else:
    * [Try to talk your way to the front. # insight: hustle # check: red]
        ~ temp result = roll_check("hustle", 5, "checkpoint-jump-queue", "red")
        { result:
            The guard shrugs and waves you past the line. Small win — and close enough to the post terminal now to see the drone's patrol log still open on the screen, timestamps that don't match its route.
            ~ gain_evidence("drone-log")
            ~ unlock_note("note-01")
            ~ unlock_thought("checkpoint-improviser")
        - else:
            He doesn't even look up. "Back of the line."
        }
        -> done
    * [Just wait it out.]
        -> done
}

== done ==
Eventually the queue spits you through, badge scanned, no questions asked.
-> END

// Mei Hong's repeat-visit topic loop (UI_PASS_SPEC.md §4) — a separate
// entry point from the top-of-file flow above, only ever reached via
// storyStore.loadStory's entryKnot option once she's been met once. Every
// topic loops back here rather than reaching END, so the ink Story stays
// parked at this menu between visits; "Leave Conversation" is a TS-only
// action in ConversationScreen; it never advances this knot.
=== mei_hong_topics ===
Mei Hong gives you her attention again — patient, watchful, still deciding how much this room can afford to say out loud.
* [Ask about her role here. # insight: ledger]
    "Operations. I keep the lights on and the paperwork honest — most days." She doesn't quite meet your eyes on "honest."
    -> mei_hong_topics
* [Ask about the checkpoint queue outside. # insight: hustle]
    "Corporate optics. Aveline wants to look careful without slowing anyone down who actually matters." A small, tired smile. "You noticed."
    -> mei_hong_topics
* [Ask if she's worried about the investigation. # check: white]
    ~ temp worriedResult = roll_check("ledger", 6, "checkpoint-mei-hong-worried", "white")
    { worriedResult:
        Her composure slips half a second before she catches it. "Worried isn't the word I'd use. Careful, maybe."
    - else:
        "Worried?" A short laugh, too quick. "I don't have the luxury."
    }
    -> mei_hong_topics
* { is_red_check_consumed("checkpoint-jump-queue") } [Ask about the guard at the gate. # insight: static]
    "Him? He's not paid enough to care who's late." She glances toward the checkpoint. "Neither am I, most days."
    -> mei_hong_topics
* { has_thought("company-man-doubt") } [Ask her what "handled" usually means, around here. # insight: ledger]
    Mei Hong's expression doesn't change, but she takes a second longer to answer than she has for anything else. "It means someone decided it wasn't worth a second memo. That's all it ever means." # speaker: npc:meiHong
    -> mei_hong_topics
* [Ask where the rest of the staff are. # insight: ledger]
    "The lounge, mostly." She nods toward it without quite looking. "Everyone off the floor is parked in there until your people finish. Some of them will talk to you. Most of them don't know enough to be careful about it yet." # speaker: npc:meiHong
    -> mei_hong_topics

// Aveline Faculty Lounge sub-location (CASE_1_LOCATION_MATRIX.md's "Aveline
// Faculty Lounge") — reached via its own Hub POIs' `sceneKnot`/`topicsKnot`
// rather than this file's default top-level flow (LocationHubScreen.tsx's
// enterHubInteraction).

// Lakshmi Avani's first encounter. Falls through to -> END (not into her
// topics loop) so DialogueScreen's finalizeEndedScene() actually marks her
// met — see storyStore.ts's `activeNpcId` / LocationHubScreen's `sceneKnot`.
=== lakshmi_avani_intro ===
The lounge smells like cold coffee and an overworked vending machine. A woman in a lab coat looks up from a shift roster taped crooked to the wall — visibly relieved to have someone to talk to who isn't wearing a CID uniform.
{ ledger >= 3:
    The Ledger clocks the coat, the badge, the roster she's still holding — junior enough to still be doing her own paperwork, senior enough that Aveline trusts her near a subject file. # speaker: insight:ledger
- else:
    Just a lab coat and a roster, as far as you can tell.
}

"Lakshmi Avani. Bio-engineering." She offers a hand, then seems to remember she's not sure that's allowed right now, and just nods instead. "Everyone's parked in here until your people finish with the floor. Ask me anything — I don't think I know enough to get in trouble for it." # speaker: npc:lakshmiAvani
~ adjust_affinity("lakshmiAvani", 1)
-> END

// Repeat-visit topic loop (same pattern as mei_hong_topics above). Staged
// by casefile/relationship progress rather than flat from the first visit
// (CASE_1_CAST_SPEC.md's Lakshmi entry) — the base three topics are always
// available and nudge affinity_lakshmi_avani a little on pick
// (Architecture §14, GAME_GUIDE.md §10); the last three only appear once
// she's said enough, or warmed up enough, to say them.
=== lakshmi_avani_topics ===
{ affinity_lakshmi_avani >= 3:
    Lakshmi looks up before you've even finished crossing the room — something almost like ease in it now. "Back already?" # speaker: npc:lakshmiAvani
- else:
    Lakshmi looks up from whatever she's pretending to read. "Back already?" # speaker: npc:lakshmiAvani
}
* [Ask what she actually works on. # insight: graft]
    "Adaptive physiology — how far a body can be pushed to tolerate the outside before it stops being survivable. That's the polite version, anyway." She doesn't offer the impolite one. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* [Ask if anything about the case has surprised her. # check: white]
    ~ temp surprisedResult = roll_check("ledger", 6, "checkpoint-lakshmi-surprised", "white")
    { surprisedResult:
        Her hands go still on the roster. "I flagged an adaptation-stress reading a few weeks back. Filed it, followed up, was told it was handled." A beat. "I didn't ask what 'handled' meant. I should have." # speaker: npc:lakshmiAvani
        ~ unlock_note("note-03")
        ~ unlock_thought("company-man-doubt")
        ~ adjust_affinity("lakshmiAvani", 2)
    - else:
        "Surprised isn't the word." She goes back to the roster before she says more than that. # speaker: npc:lakshmiAvani
    }
    -> lakshmi_avani_topics
* [Ask how morale is holding up. # insight: hustle]
    "About how you'd expect. Half this room is deciding whether to update their resume tonight or wait for the weekend." A tired almost-smile. "I haven't decided either." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* { has_thought("company-man-doubt") and not is_red_check_consumed("checkpoint-lakshmi-colleague") } [Push her on who else saw this coming. # insight: root # check: red]
    ~ temp colleagueResult = roll_check("root", 7, "checkpoint-lakshmi-colleague", "red")
    { colleagueResult:
        She doesn't answer right away — long enough that the silence is the answer. "There's someone who flagged worse than I did, earlier than I did, and said so out loud instead of just filing it." Her jaw tightens. "I'm not giving you a name. Not like this. You'd need more than asking nicely." # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", 1)
    - else:
        Something in her closes off. "I've already said more than I should have." She doesn't pick the thread back up, and doesn't quite look at you for the rest of the visit. # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", -1)
    }
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 3 } [Ask what she does when she's not down here. # insight: root]
    "Same as everyone in a hab block, probably. I've got a window box that's somehow still growing something green, and a downstairs neighbor who thinks I don't know she borrows my hotplate." A real laugh, the first unguarded one you've heard from her. "It's not much. It's mine, though." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 6 } [Tell her you're glad the lounge has her in it. # insight: root]
    That actually gets a blush out of her — fast, and she covers it by pretending to fix the roster's crooked tape. "That's — " A beat. "You're allowed to say things like that to a witness?" She's smiling when she says it, though. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics

=== checkpoint_lounge_roster_wall ===
A shift roster taped to the wall, corners curling in the lounge's stale air — names, rotations, a scrawled note in the margin about a supply order nobody's approved yet. Half the names already have a line through them, today's date scratched in beside the strikethrough.
-> END
