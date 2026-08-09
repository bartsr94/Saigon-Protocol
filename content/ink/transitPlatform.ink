// District Transit Platform (src/content/locations.ts) — flavor-light
// placeholder scene, not real GDD content (docs/GAME_GUIDE.md;
// docs/CASE_1_LOCATION_MATRIX.md's optional city-life location). No check
// in this scene — a location file isn't required to exercise the check
// EXTERNALs to be valid.

VAR hustle = 0

Rain drums on the platform awning. A vendor's working the queue with something fried and something that probably isn't quite legal.
{ hustle >= 3:
    The Hustle prices the vendor's whole setup in under a second — cheap stock, marked-up desperation tax, moves fast when a patrol walks by. # speaker: insight:hustle
- else:
    Just another platform vendor working the rain-delayed crowd.
}

* [Wait for the next car.]
    -> done

== done ==
The transit line out of District 4 is running late, same as always.
-> END
