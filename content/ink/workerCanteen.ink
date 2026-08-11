// Worker Canteen / Night Stall (src/content/locations.ts) — flavor-light
// placeholder scene, not real GDD content (docs/GAME_GUIDE.md;
// docs/CASE_1_LOCATION_MATRIX.md's optional city-life location). No check
// in this scene — a location file isn't required to exercise the check
// EXTERNALs to be valid.

VAR graft = 0
VAR hustle = 0

Shift-change crowd at the canteen counter, elbow to elbow under one buzzing strip light. Half the hands reaching for trays aren't fully human anymore.
{ graft >= 3:
    Graft clocks the prosthetics and ports under the sleeves before you register the faces — this crew works somewhere that eats bodies. Nothing here was chosen for how it looks. Every seam is functional, replaceable, the kind of modification you get because the job demands it, not because you wanted it. # speaker: insight:graft
- else:
    Just tired workers grabbing a late meal, as far as you can tell.
}

Every tray gets the same ration bar, stamped with a Baekho logo nobody bothers reading anymore. Someone's complaining about this week's algae batch tasting like the last one.
{ hustle >= 3:
    The Hustle's heard the same complaint dressed up as small talk in every canteen in the district — everyone's angling for whoever's smuggling in real rice. # speaker: insight:hustle
- else:
    Just canteen grumbling, as far as you can tell.
}

* [Sit at the counter and listen.]
    -> done

== done ==
Nobody here works at Aveline directly, but everybody's got an opinion about the lit-up building down the block.
-> END
