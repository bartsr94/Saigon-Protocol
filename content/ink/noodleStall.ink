// Back-Alley Noodle Stall (src/content/locations.ts) — flavor-light
// placeholder scene, not real GDD content (docs/GAME_GUIDE.md).
// No check in this scene — a location file isn't required to exercise the
// check EXTERNALs to be valid.

VAR root = 0

Steam off a noodle cart fogs the alley. Whoever's cooking is playing music from home, not from here.
{ root >= 3:
    Root catches the melody before the lyrics do — something from a coast that isn't underwater yet. # speaker: insight:root
- else:
    The music is just background noise to you.
}

* [Order a bowl and listen.]
    -> done

== done ==
Nobody at the stall asks who you are. That's the whole point of the place.
-> END
