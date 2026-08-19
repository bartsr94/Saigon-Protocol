// District 4 Public Incident Scene (src/content/locations.ts) —
// flavor-light placeholder scene, not real GDD content
// (docs/GAME_GUIDE.md; docs/CASE_1_LOCATION_MATRIX.md's escalation-point
// location). No check in this scene — a location file isn't required to
// exercise the check EXTERNALs to be valid.

VAR muscle_memory = 0
VAR static = 0

Tape's up across half the street. Whatever happened here happened fast, and the uniforms holding the line haven't decided what story they're telling yet.
{ muscle_memory >= 3:
    Muscle Memory reads the scatter of the crowd before the tape does — nobody's standing where they'd stand for a simple mugging. # speaker: insight:muscle_memory
- else:
    It could be anything from here. You'd need to get closer.
}
{ static >= 3:
    Static notes the tape sagging under standing rainwater nobody's cleared. Even a crime scene waits on the weather here. # speaker: insight:static
}

* [Duck under the tape and take a look.]
    -> done

== done ==
Whatever this was, it isn't going to stay a District 4 problem for much longer.
-> END
