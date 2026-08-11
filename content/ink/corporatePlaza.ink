// District 1 Corporate Plaza (src/content/locations.ts) — flavor-light
// placeholder scene, not real GDD content (docs/GAME_GUIDE.md;
// docs/CASE_1_LOCATION_MATRIX.md's polished-power-space location). No
// check in this scene — a location file isn't required to exercise the
// check EXTERNALs to be valid.

VAR mask = 0
VAR ledger = 0

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

* [Wait to see if anyone worth talking to actually comes down.]
    -> done

== done ==
Nobody comes down. Not today.
-> END
