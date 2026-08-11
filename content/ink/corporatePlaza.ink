// District 1 Corporate Plaza (src/content/locations.ts) — flavor-light
// placeholder scene, not real GDD content (docs/GAME_GUIDE.md;
// docs/CASE_1_LOCATION_MATRIX.md's polished-power-space location). No
// check in this scene — a location file isn't required to exercise the
// check EXTERNALs to be valid.

VAR mask = 0
VAR ledger = 0
VAR graft = 0

Polished stone, filtered air, and private security that watches you the way people watch something that might scratch the floor. Nobody with real authority takes meetings with beat detectives — not yet.
{ mask >= 3:
    The Mask reads the lobby's whole performance in one glance — this room was built to make you feel exactly this small. # speaker: insight:mask
- else:
    It's just an expensive lobby, as far as you can tell.
}

A fruit bowl sits on the reception desk, untouched and clearly not synthesized. Nobody down here would say out loud what it costs to keep it looking like that.
{ ledger >= 3:
    The Ledger does the math anyway — that bowl alone is worth more than most of District 4 sees in a month of rations. # speaker: insight:ledger
- else:
    It's just fruit, as far as you can tell.
}

Two visitors wait near the elevators, both clearly used to rooms like this one. One carries an old-money severity — pale, sharp-featured, dressed like capital that's never once had to prove itself. The other doesn't read as any one place at all, features blended too precisely to be an accident.
{ graft >= 3:
    Graft clocks the second one first — gene-level work, not surgical, not survival-tier. The kind of blend that says a family paid for the best of two different pedigrees before the kid was even born. The first one's a different flex entirely: old capital still betting a certain look means something in a city the Compact actually runs. # speaker: insight:graft
- else:
    Just two well-dressed strangers waiting for an elevator, as far as you can tell.
}

Near the elevators, a discreet screen no bigger than a picture frame cycles a very different message than anything back at the checkpoint — Terra Nova, Mars acreage, presented like a vacation package instead of an escape hatch.
{ ledger >= 3:
    The Ledger clocks the difference immediately — the wage pitch outside is aimed at people who need it, this one's aimed at people who don't, sold as a lifestyle instead of a lifeline. # speaker: insight:ledger
- else:
    Just another screen, easy to ignore in a lobby built entirely out of things you're not meant to look at directly.
}

* [Wait to see if anyone worth talking to actually comes down.]
    -> done

== done ==
Nobody comes down. Not today.
-> END
