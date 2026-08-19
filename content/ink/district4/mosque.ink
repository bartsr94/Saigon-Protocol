// Musholla Al-Falah — the Kampung's prayer house (src/content/locations.ts,
// LocationId 'mosque') — District 4, per docs/MOSQUE_KAMPUNG_SPEC.md.
// Optional city-life location (docs/CASE_1_LOCATION_MATRIX.md), not real
// Case 1 content. No check in this scene — a location file isn't required
// to exercise the check EXTERNALs to be valid.

VAR ledger = 0
VAR root = 0
VAR muscleMemory = 0
VAR mask = 0

The room is smaller than the word "mosque" promises — a converted platform-level unit, mats instead of carpet, a qibla marked on the wall in tape rather than architecture. Nothing about it was built to be this. Everything about it has been made to work anyway.
An older man meets you at the door before you're two steps in, unhurried, already reading you. "Prayer's not for another hour. You're welcome to sit, if that's what you're here for." # speaker: npc:pakRahman

{ ledger >= 3:
    The Ledger counts the room the way he clearly already has — eleven mats out, four regulars missing who were here last week, and no way to ask after them that wouldn't sound like exactly what it'd be. Someone keeps that same count for reasons that have nothing to do with prayer. # speaker: insight:ledger
- else:
    A modest room, quieter than you expected, maybe a dozen people scattered through it.
}

He settles back near the door instead of taking a mat himself — close enough to greet the next person in, angled so nothing behind him is at his back.
{ muscleMemory >= 3:
    Muscle Memory clocks it instantly: that's not hospitality, that's a door watch. Weight balanced, sightline held, a body still running a routine some contractor drilled into it long before this room existed. # speaker: insight:muscleMemory
- else:
    Just an old man standing near the door, as far as you can tell.
}

Someone's stitched a length of batik cloth over the tape-marked qibla — faded, salt-stained at one corner, the kind of thing that survives a crossing because someone refused to let it not.
{ root >= 3:
    Root doesn't need the story told to feel its weight — three generations removed from an archipelago most of this room has only ever seen in someone else's memory, and still carried forward anyway, stitched into a wall that isn't even a real wall. Grief with nowhere left to point. # speaker: insight:root
- else:
    Just a piece of cloth on the wall. It looks old.
}

By the time you leave, the room has warmed toward you in a way it wasn't when you walked in — questions answered a beat slower than they'd be asked among regulars, a joke translated instead of just laughed at.
{ mask >= 3:
    The Mask reads the whole shift for what it is — a second, gentler face put on for a stranger at the door, the same instinct that decides which language, which posture, which version of the truth gets handed to which visitor. This room has had a lot of practice deciding what a stranger is owed. # speaker: insight:mask
- else:
    Everyone's been polite enough. You can't tell if that's just how it is here.
}

* [Thank him and go.]
    -> done

== done ==
"Come back Friday, if you want to see it full." Pak Rahman doesn't ask why you came, and doesn't offer why the room counts its own the way it does. Whatever gets reported up Nusantara's chain about who still shows up here, it isn't going to be him doing the telling. # speaker: npc:pakRahman
-> END
