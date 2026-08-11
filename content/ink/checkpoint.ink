// SEZ Checkpoint (src/content/locations.ts) — flavor-light placeholder scene,
// not real GDD content (docs/GAME_GUIDE.md). Exercises a Red
// check inline, per this location's own content.

EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)

VAR hustle = 0
VAR static = 0
VAR graft = 0

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
