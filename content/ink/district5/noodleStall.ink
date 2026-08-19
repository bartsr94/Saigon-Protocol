// Back-Alley Noodle Stall (src/content/locations.ts) — flavor-light
// placeholder scene, not real GDD content (docs/GAME_GUIDE.md).
// No check in this scene — a location file isn't required to exercise the
// check EXTERNALs to be valid.

VAR root = 0
VAR hustle = 0
VAR graft = 0

Steam off a noodle cart fogs the alley. Whoever's cooking is playing music from home, not from here.
{ root >= 3:
    Root catches the melody before the lyrics do — something from a coast that isn't underwater yet. # speaker: insight:root
- else:
    The music is just background noise to you.
}

The broth smells like actual fish sauce, not the algae-cut kind. Whatever's in this bowl didn't come through a licensed import manifest.
{ hustle >= 3:
    The Hustle prices it without trying — real garlic, real herbs, a supply line someone's risking a fine to keep open. # speaker: insight:hustle
- else:
    It just tastes better than it should, and you leave it at that.
}

The cook's forearm has a fresh dressing taped over something that isn't a burn — a patch job, self-administered or close to it, still weeping a little at the edge.
{ graft >= 3:
    Graft's seen enough back-alley mod work to place it instantly — a cheap tolerance graft, no clinic, no follow-up care. Whatever job needs a body that can take this didn't come with a licensed price tag. # speaker: insight:graft
- else:
    Just a bandage, as far as you can tell.
}

* [Order a bowl and listen.]
    -> done

== done ==
Nobody at the stall asks who you are. That's the whole point of the place.
-> END
