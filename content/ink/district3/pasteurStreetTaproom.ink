// Pasteur Street Taproom (src/content/locations.ts) — District 3's nightlife
// anchor, per the vault's District 3 file: a villa ground floor converted
// into a hand-brewed taproom, run by Diễm Khương out of her own family's
// house. Optional city-life location, not Case 1 content — same status as
// content/ink/district4/workerCanteen.ink. Two POIs: the family photo wall
// below, and Diễm Khương (content/ink/district3/pasteurStreet/diemKhuong.ink).

INCLUDE pasteurStreet/diemKhuong.ink

EXTERNAL adjust_affinity(npcId, amount)

VAR ledger = 0
VAR root = 0
VAR mask = 0
VAR graft = 0
VAR hustle = 0

=== pasteur_street_family_wall ===
Framed photographs climb the wall behind the bar in no particular order — villa portraits going back well past the SEZ, past the Compact, past whatever government was performing legitimacy the century a given photo was taken. The faces thin out noticeably somewhere around the last two generations. # background: pasteurStreetTaproom
{ ledger >= 3:
    The Ledger reads the gap the way it reads any missing line item — not an accident, a withdrawal. Whoever's missing from the last two rows of frames took their equity off-world and left the deed behind as an asset nobody's bothered collecting rent on since. # speaker: insight:ledger
- else:
    Whoever's missing from the last two rows of frames, nobody's put a photo up to replace them.
}
{ root >= 3:
    Root doesn't read it as absence so much as a specific kind of grief — the family that's still here living underneath the family that isn't, in a house too big for the ones who stayed and too far away for the ones who left to miss properly. # speaker: insight:root
- else:
    Just an old house with fewer people in it than the walls were built for.
}
The back stair never stays empty for long. Some people heading up are laughing too hard. Some aren't pretending at all.
{ mask >= 3:
    The Mask reads the upstairs traffic for what it is almost immediately — spillover hookups, hourly rooms, quiet paid company, and at least one arrangement that looks more like debt service than desire. The house makes money whichever story a guest wants to tell about it. # speaker: insight:mask
- else:
    Whatever's happening upstairs, the bar has decided not to comment on it.
}
The newest photo on the wall isn't a portrait at all — it's the taproom's opening night, a room full of faces that don't share a bloodline with anyone else on the wall.

* [Take it in and get back to the bar.]
    -> pasteur_street_family_wall_done

== pasteur_street_family_wall_done ==
-> END
