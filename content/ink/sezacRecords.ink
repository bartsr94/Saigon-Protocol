// SEZAC Records / Licensing Office (src/content/locations.ts) —
// flavor-light placeholder scene, not real GDD content
// (docs/GAME_GUIDE.md; docs/CASE_1_LOCATION_MATRIX.md's paper-trail
// location). No check in this scene — a location file isn't required to
// exercise the check EXTERNALs to be valid.

VAR ledger = 0

A queue number, a counter, and a clerk who has perfected telling you nothing politely. Every request form has a box for "official case number" you're not sure you should fill in yet. The rack behind the counter is stacked as high with water-permit and ration-schedule renewals as anything Aveline-related.
{ ledger >= 3:
    The Ledger prices the delay before you even finish reading the form — this counter isn't slow, it's built to be. Whatever actually decides who gets water, food, or answers, it isn't happening at this window. # speaker: insight:ledger
- else:
    It's just a slow counter, as far as you can tell.
}

* [Fill out the request and wait.]
    -> done

== done ==
The clerk stamps something and slides it back. Whether it's what you actually asked for is a different question.
-> END
