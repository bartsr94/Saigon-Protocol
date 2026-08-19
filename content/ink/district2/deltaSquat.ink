// Drowned Delta Squat (src/content/locations.ts) — flavor-light placeholder
// scene, not real GDD content (docs/GAME_GUIDE.md).

VAR static = 0
VAR root = 0
VAR graft = 0

Half the squat's ground floor is underwater at high tide; the salvagers who live here just built the second floor higher.
{ static >= 3:
    Static clocks the water line creeping a little further up the wall since your last visit. # speaker: insight:static
- else:
    The water looks the same as always to you.
}

Someone's cleaning a bucket of foraged greens on the stairs, out past where the greenhouse platforms hum somewhere in the flood haze.
{ root >= 3:
    Root recognizes the gesture more than the food — people who've done this before, in a country that isn't here anymore. # speaker: insight:root
- else:
    You wouldn't touch it yourself.
}

One of the salvagers on the stairs favors a leg that whines faintly with every step — servo work gone unmaintained long past when it should've been replaced.
{ graft >= 3:
    Graft knows that whine. Out here, a mod doesn't fail because the tech's bad — it fails because nobody this far out has the parts, or the money, to keep it running right. # speaker: insight:graft
- else:
    Just someone favoring a bad leg, as far as you can tell.
}

* [Ask around.]
    -> done

== done ==
Nobody here is in a hurry to talk to a cop, but nobody runs either. That's something.
-> END
