// CID Office (src/content/locations.ts) — flavor-light placeholder scene,
// not real GDD content (docs/GAME_GUIDE.md;
// docs/CASE_1_LOCATION_MATRIX.md's recurring institutional hub). No check
// in this scene — a location file isn't required to exercise the check
// EXTERNALs to be valid.

VAR mask = 0
VAR static = 0

Fluorescent light, cold coffee, and a case board that's still mostly empty pins and string. Someone up the chain wants a status update by end of shift.
{ mask >= 3:
    The Mask already knows which version of this update keeps the case open a little longer. # speaker: insight:mask
- else:
    You'll have to figure out what to tell them the honest way.
}

Nobody in the bullpen is wearing a mask. Filtered air, recycled and metered but clean, is one of the few things this building actually gets right.
{ static >= 3:
    Static usually has something to say about the air. In here, for once, it doesn't — and that silence is its own kind of tell about who this room was built for. # speaker: insight:static
- else:
    It's just quiet, the way an office is supposed to be.
}

* [File the update and get back to it.]
    -> done

== done ==
Whatever you tell them, it buys you another day before someone above your pay grade calls this closed.
-> END
