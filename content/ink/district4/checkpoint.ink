// SEZ Checkpoint (src/content/locations.ts) — flavor-light placeholder scene,
// not real GDD content (docs/GAME_GUIDE.md). Exercises a Red
// check inline, per this location's own content. The Aveline Faculty
// Lounge's NPCs each own their own file under content/ink/district4/aveline/
// (INCLUDEd below) rather than being authored here — this file keeps only
// the shared EXTERNAL/VAR declarations and its own top-level queue flow.

INCLUDE aveline/meiHong.ink
INCLUDE aveline/lakshmiAvani.ink

EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL gain_evidence(id)
EXTERNAL unlock_note(id)
EXTERNAL unlock_thought(id)
EXTERNAL has_thought(id)
EXTERNAL adjust_affinity(npcId, amount)
EXTERNAL has_evidence(id)
EXTERNAL has_note(id)
EXTERNAL has_case_flag(flag)
EXTERNAL set_case_flag(flag)

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

// Aveline Faculty Lounge sub-location (CASE_1_LOCATION_MATRIX.md's "Aveline
// Faculty Lounge") — reached via its own Hub POIs' `sceneKnot`/`topicsKnot`
// rather than this file's default top-level flow (LocationHubScreen.tsx's
// enterHubInteraction). Mei Hong's and Lakshmi Avani's content lives in
// content/ink/district4/aveline/ (INCLUDEd above); this file only keeps the lounge's
// own fixture inspect below.

=== checkpoint_lounge_roster_wall ===
A shift roster taped to the wall, corners curling in the lounge's stale air — names, rotations, a scrawled note in the margin about a supply order nobody's approved yet. Half the names already have a line through them, today's date scratched in beside the strikethrough.
-> END
