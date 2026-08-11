// Quán Bà Châu — Xóm Chàm's canteen (src/content/locations.ts, LocationId
// 'workerCanteen') — District 4, per docs/WORKER_CANTEEN_XOM_CHAM_SPEC.md.
// Optional city-life location (docs/CASE_1_LOCATION_MATRIX.md), not real
// Case 1 content. No check in this scene — a location file isn't required
// to exercise the check EXTERNALs to be valid.

VAR graft = 0
VAR hustle = 0
VAR root = 0
VAR ledger = 0

The counter's run by an older woman everyone just calls Bà Châu, ladling out the same ration-bar stew to a room that's been eating here since before the current flood wall went up. No pork on the menu, no sign explaining why — nobody at these tables was ever going to ask.
"Sit if you're eating, stand if you're not. Either way, don't block the door." She doesn't look up from the pot. # speaker: npc:baChau

Her forearm clicks faintly when she reaches for a ladle — an old joint, well kept, the kind of hardware a dockyard clinic doesn't get licensed to install anymore.
{ graft >= 3:
    Graft reads it before anything else in the room does — a hydraulic joint, decades old, still doing its job. "Wharf took the arm. I stayed for the wharf anyway." Half the hands in this room are carrying some version of the same trade, patched and re-patched, generation over generation. # speaker: insight:graft
- else:
    Just an old woman moving stiffly, as far as you can tell.
}

Two tables run two different rhythms — one crowd breaking to face a corner at the same private moment, another that doesn't quite, older regulars sitting easy next to a younger crowd that keeps its own line drawn a little more carefully. Nobody at either table treats it as a thing worth explaining to a stranger. Two ways of being Xóm Chàm, sharing one counter.

The stew tastes like the ration allotment it is, until it doesn't — something in the seasoning that isn't on any Baekho ingredient list.
{ root >= 3:
    Root places it before your tongue does — a spice memory older than the flood wall, older than the platform under your feet, carried from a Delta that's underwater now and cooked into a ration bar until it tastes like something that used to be a coastline instead of an allotment. # speaker: insight:root
- else:
    Better than it has any right to be. You leave it at that.
}

Someone slides a plate of actual grilled fish across a back table, no ticket, no manifest — paid in cash that changes hands under the counter's edge, not over it.
{ hustle >= 3:
    The Hustle's seen this arrangement in every canteen this district's ever had — a boat that didn't file its catch, a cook who doesn't ask, and a district old enough to remember exactly why asking was never a good idea here. # speaker: insight:hustle
- else:
    Just a plate of fish, better than anything on the tray line.
}

A SEZAC registry poster is taped by the door, the same box ticked for "Xóm Chàm" and "Kampung" both, like whoever printed it couldn't be bothered to learn there were two different names.
{ ledger >= 3:
    The Ledger reads it as exactly what it is — not an oversight, just an admission that nobody filling out that form was ever paid to care about the difference. # speaker: insight:ledger
- else:
    Somebody's scrawled a correction under the box in pen. It won't change anything, but it's there.
}

Someone two tables over is telling a story that isn't new — a cousin who signed a lunar labor contract two winters back, wired money home for a while, then stopped answering anything but the automated check-ins.
{ root >= 3:
    Root's heard versions of this story from three different tables in this district alone. Nobody ever says the word missing. They just stop mentioning the cousin's name after a while, the way you stop mentioning anything that's stopped answering. # speaker: insight:root
- else:
    Just canteen talk. You've heard some version of it before, somewhere else.
}

* [Sit at the counter and listen.]
    -> done

== done ==
Bà Châu doesn't ask why a stranger's sitting at her counter, and nobody else does either — District 4 stopped asking those questions long before you were born. If she knows who's still keeping the old prayers down in the flooded level under this platform, where SEZAC can't come counting heads, she's not saying it to you today. # speaker: npc:baChau
-> END
