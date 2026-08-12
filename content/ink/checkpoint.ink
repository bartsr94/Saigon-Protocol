// SEZ Checkpoint (src/content/locations.ts) — flavor-light placeholder scene,
// not real GDD content (docs/GAME_GUIDE.md). Exercises a Red
// check inline, per this location's own content.

EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)

VAR hustle = 0
VAR static = 0
VAR graft = 0
VAR ledger = 0

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
            The guard shrugs and waves you past the line. Small win.
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
