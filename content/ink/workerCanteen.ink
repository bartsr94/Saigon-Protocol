// Worker Canteen / Night Stall (src/content/locations.ts) — flavor-light
// placeholder scene, not real GDD content (docs/GAME_GUIDE.md;
// docs/CASE_1_LOCATION_MATRIX.md's optional city-life location). No check
// in this scene — a location file isn't required to exercise the check
// EXTERNALs to be valid.

VAR graft = 0

Shift-change crowd at the canteen counter, elbow to elbow under one buzzing strip light. Half the hands reaching for trays aren't fully human anymore.
{ graft >= 3:
    Graft clocks the prosthetics and ports under the sleeves before you register the faces — this crew works somewhere that eats bodies. # speaker: insight:graft
- else:
    Just tired workers grabbing a late meal, as far as you can tell.
}

* [Sit at the counter and listen.]
    -> done

== done ==
Nobody here works at Aveline directly, but everybody's got an opinion about the lit-up building down the block.
-> END
