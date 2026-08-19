// Turtle Lake Plaza (src/content/locations.ts, LocationId 'turtleLakePlaza') —
// District 3's civic anchor, per the vault's District 3 file: a fountain
// square that's been a citadel gate, a colonial water tower, and a
// diplomatic monument in turn, now just where the district's actual
// nightlife happens. Optional city-life location (same status as
// content/ink/district4/workerCanteen.ink), not real Case 1 content. No check in this
// scene — a location file isn't required to exercise the check EXTERNALs to
// be valid.

VAR root = 0
VAR graft = 0
VAR static = 0
VAR mask = 0

The fountain at the plaza's center hasn't run water in longer than anyone sitting around it has been alive, but nobody's gotten around to draining the basin either, so it just sits there, dry and lit from underneath, doing the job of a landmark without doing the job it was built for. # background: turtleLakePlaza # ambience: +marketChatter
{ root >= 3:
    Root's read this square before you ever set foot in it — a citadel gate, then a water tower, then a monument to an alliance that doesn't exist anymore, and now this. Every authority that's tried to tell this ground what it means has eventually walked away and left the ground to decide for itself. # speaker: insight:root
- else:
    Somebody told you once this fountain used to mean something specific. You can't remember what.
}

Street food carts ring the plaza's edge, none of them licensed in any way SEZAC would recognize, all of them doing steady business anyway — nobody's bothered enforcing a permit here in longer than anyone can say.
{ static >= 3:
    Static notices the air first, the way it always notices air — a few degrees cooler under this canopy than the last open street you crossed to get here. Not engineered, not pumped, just old trees nobody cut down doing exactly what old trees do. It's not nothing, this far into a wet-season night. # speaker: insight:static
- else:
    It's cooler here than it has any right to be, given the season. You don't think much of it.
}

A knot of teenagers has claimed one of the benches, comparing something on someone's forearm under a borrowed light — a cosmetic graft, still healing, the kind of decorative work nobody down at the port would bother licensing because nobody down at the port would bother wanting it.
{ graft >= 3:
    Graft clocks it immediately for what it is: nothing utilitarian about the work, no tolerance rating worth mentioning, purely for the way it looks under a string of borrowed lights. A body modified for the pleasure of it instead of the necessity of it — the same graft on a District 4 dockworker would mean something entirely different, and everyone in this square already knows it. # speaker: insight:graft
- else:
    Kids showing off some kind of body work to each other. You don't clock the specifics.
}

Somebody's set up an amp on a milk crate near the dry fountain and started playing, no permit, no cover, no one collecting for it — a crowd's gathering anyway, the way a crowd always gathers for this exact kind of thing, in this exact kind of square, whatever century you happen to be standing in.
{ mask >= 3:
    The Mask sorts the crowd without much effort — old villa money dressed down to blend, squat-culture regulars who actually live here, a handful of off-world visitors on a home-world layover trying to look like they belong. Nobody's checking credentials. That's the whole point of the place. # speaker: insight:mask
- else:
    Just a crowd, mixed enough that you can't easily place who belongs and who's just visiting.
}

* [Sit by the fountain and let the night run its course.]
    -> done

== done ==
Nobody in this square asks why a stranger's sitting here, and nobody expects an explanation either — Turtle Lake's never belonged to anyone official enough to demand one. Whatever you came looking for, it isn't going to announce itself. It's just going to be here tomorrow night too, same as it was the night before, same as it's been for longer than any single government has managed to stay in charge of it.
-> END
