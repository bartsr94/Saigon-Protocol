// Drowned Delta Squat (src/content/locations.ts) — flavor-light placeholder
// scene, not real GDD content (docs/CONTENT_PIPELINE_SPEC.md).

VAR static = 0

Half the squat's ground floor is underwater at high tide; the salvagers who live here just built the second floor higher.
{ static >= 3:
    Static clocks the water line creeping a little further up the wall since your last visit. # speaker: insight:static
- else:
    The water looks the same as always to you.
}

* [Ask around.]
    -> done

== done ==
Nobody here is in a hurry to talk to a cop, but nobody runs either. That's something.
-> END
