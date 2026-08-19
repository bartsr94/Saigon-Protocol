// Y Duoc - Cholon Medical Institute (src/content/locations.ts) — District 5's
// gray-clinic lead from the Case 1 docs. Now a walkable grid Location Hub
// (src/content/locationHubs.ts) with two POIs: the original intake/referral
// desk investigation beat below, and Sarah Mulligan, an Erasmus exchange
// student working the intake floor.

INCLUDE cholon/sarahMulligan.ink

EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL gain_evidence(id)
EXTERNAL unlock_note(id)
EXTERNAL adjust_affinity(npcId, amount)

VAR ledger = 0
VAR graft = 0
VAR root = 0
VAR static = 0

=== y_duoc_referral_desk ===
The public intake hall still looks like a hospital anyone in the city might trust — tile floor scrubbed too often, queue numbers blinking over cracked plastic chairs, the smell of antiseptic losing a slow fight against rain-damp clothes and street exhaust. # background: cholonClinic # ambience: +marketChatter # ambience: +filterStatic
{ root >= 3:
    Root catches the room's social rhythm before the paperwork does — families leaning close, talking low, everyone here already knowing which questions are safe and which ones get a chart quietly put away before your turn comes up. # speaker: insight:root
- else:
    Just another overfull intake room, as far as you can tell.
}

A notice board near triage lists ordinary things in ordinary language — respiratory checks, graft maintenance, flood-fever monitoring. Under that, a different stack of slips sits half-hidden under a clipboard: handwritten follow-up windows, no department stamp, no physician name.
{ graft >= 3:
    Graft doesn't need the full text to place the shorthand — tolerance suppressants, rejection-management, adaptation stress. Not street-clinic improvisation. Somebody with real training wrote these, then made sure nobody official signed them. # speaker: insight:graft
- else:
    The handwriting is quick and technical. You can tell it matters more than you can tell why.
}

A refrigeration unit hums behind a partition wall, steady enough to vanish until the Static catches the rhythm under it.
{ static >= 3:
    Static hears the difference immediately — backup power, not municipal. Whatever they keep cold back there is too valuable to trust to the district grid. # speaker: insight:static
- else:
    Just clinic noise, electrical and tired.
}

The clerk at the intake window doesn't look frightened by your badge. Just weary. "If you're here for an audit, take a number. If you're here for a patient, talk to triage. If you're here to ask where certain people get sent after the respectable hospitals stop answering, you didn't hear that from me."

* [Lean on the paperwork trail. # check: white]
    ~ temp ledgerResult = roll_check("ledger", 6, "y-duoc-paperwork-trail", "white")
    { ledgerResult:
        You don't push the clerk. You push the gap in the process instead — unsigned slips, reused patient codes, inventory shorthand that only makes sense if somebody here is smoothing out complications the official system doesn't want attached to a case file.

        The clerk lets out a slow breath, glances once toward the partition, and palms you a carbon copy from the bottom of the stack. "You didn't get that from me either."
        ~ gain_evidence("aftercare-ledger-slip")
        ~ unlock_note("note-04")
    - else:
        The clerk's expression shutters before you finish the question. "Then take a number," she says again, and this time there's nothing underneath it.
    }
    -> done
* [Sit with the waiting families and listen. # insight: root]
    Nobody says Aveline. Nobody says subject. They say things like follow-up, tolerance, relapse, transfer. They talk about bodies that need managing after somebody else has already decided the experiment is over.
    -> done

== done ==
Whether this place is charity, cleanup, or both, it isn't routine medicine. Cholon is carrying part of the cost for work that started somewhere with cleaner walls and better lawyers.
-> END
