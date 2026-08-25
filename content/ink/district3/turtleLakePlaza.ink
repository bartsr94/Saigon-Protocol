// Turtle Lake Plaza (src/content/locations.ts, LocationId 'turtleLakePlaza') —
// District 3's civic anchor, per the vault's District 3 file: a fountain
// square that's been a citadel gate, a colonial water tower, and a
// diplomatic monument in turn, now just where the district's actual
// nightlife happens. Optional city-life location (same status as
// content/ink/district4/workerCanteen.ink), not real Case 1 content.

EXTERNAL adjust_affinity(npcId, amount)

VAR root = 0
VAR graft = 0
VAR static = 0
VAR mask = 0
VAR ledger = 0
VAR hustle = 0
VAR affinity_ophelia = 0

The fountain at the plaza's center hasn't run water in longer than anyone sitting around it has been alive, but nobody's gotten around to draining the basin either, so it just sits there, dry and lit from underneath, doing the job of a landmark without doing the job it was built for. # background: turtleLakePlaza # ambience: +marketChatter
{ root >= 3:
    Root's read this square before you ever set foot in it — a citadel gate, then a water tower, then a monument to an alliance that doesn't exist anymore, and now this. Every authority that's tried to tell this ground what it means has eventually walked away and left the ground to decide for itself. # speaker: insight:root
- else:
    Somebody told you once this fountain used to mean something specific. You can't remember what.
}

Street food carts ring the plaza's edge, none of them licensed in any way SEZAC would recognize, all of them doing steady business anyway — nobody's bothered enforcing a permit here in longer than anyone can say.
{ static >= 3:
    Static notices the air first, the way it always notices air — a few degrees cooler under this canopy than the last open street you crossed to get here. Not engineered, not pumped, just old trees nobody cut down doing exactly what old trees do. It's not nothing, this far into a wet-season night. # speaker: insight:static
- else:
    It's cooler here than it has any right to be, given the season. You don't think much of it.
}

Around the dry fountain, the night's economy keeps branching. A pair of women in borrowed lacquer and a boy too young for the suit he's wearing drift from bench to bench with the careful patience of people who need tonight's company to become tomorrow's breakfast.
{ mask >= 3:
    The Mask doesn't mistake the choreography for leisure. Some people in this square are here to hear music. Some are here to be seen with the right stranger. Some are here because whatever they are willing to sell still pays better in person than it does through a platform cut. # speaker: insight:mask
- else:
    Not everybody drifting the square tonight is here for the music.
}

A knot of teenagers has claimed one of the benches, comparing something on someone's forearm under a borrowed light — a cosmetic graft, still healing, the kind of decorative work nobody down at the port would bother licensing because nobody down at the port would bother wanting it.
{ graft >= 3:
    Graft clocks it immediately for what it is: nothing utilitarian about the work, no tolerance rating worth mentioning, purely for the way it looks under a string of borrowed lights. A body modified for the pleasure of it instead of the necessity of it — the same graft on a District 4 dockworker would mean something entirely different, and everyone in this square already knows it. # speaker: insight:graft
- else:
    Kids showing off some kind of body work to each other. You don't clock the specifics.
}

At the plaza edge, a courier in clinic scrubs with the logo half-peeled off passes a white cold-case to a bike runner and doesn't make eye contact before disappearing back into the crowd.
{ graft >= 3:
    Graft knows the proportions on sight: anti-rejection ampoules, black-market tissue, maybe a gland pack if someone upstairs is paying enough not to ask whose. The city doesn't keep this many quiet couriers for anything clean. # speaker: insight:graft
- else:
    Medical freight, maybe. Whatever it is, nobody involved wants a witness lingering over it.
}

Somebody's set up an amp on a milk crate near the dry fountain and started playing, no permit, no cover, no one collecting for it — a crowd's gathering anyway, the way a crowd always gathers for this exact kind of thing, in this exact kind of square, whatever century you happen to be standing in.
{ mask >= 3:
    The Mask sorts the crowd without much effort — old villa money dressed down to blend, squat-culture regulars who actually live here, a handful of off-world visitors on a home-world layover trying to look like they belong, and predators who can smell who's fallen behind on rent. Nobody's checking credentials. That's the whole point of the place. # speaker: insight:mask
- else:
    Just a crowd, mixed enough that you can't easily place who belongs and who's just visiting.
}

* [Sit by the fountain and let the night run its course.]
    -> done

== done ==
Nobody in this square asks why a stranger's sitting here, and nobody expects an explanation either — Turtle Lake's never belonged to anyone official enough to demand one. Whatever you came looking for, it isn't going to announce itself. It's just going to be here tomorrow night too: the songs, the food carts, the quiet sales, the rented affection, the clinic couriers, the whole district pretending it still counts as nightlife because admitting what it's become would make everybody leave too early.
-> END

=== ophelia_intro ===
A woman in black lace and a severe corset dress is pretending not to watch the crowd while absolutely watching it. The look is immaculate: black lipstick, dead-still posture, long dark hair cut sharp enough to read from across the plaza. The performance would sell untouchable, if not for the fact that she has checked the same man near the food carts three times in twenty seconds. # speaker: npc:ophelia # background: turtleLakePlaza
{ mask >= 3:
    The Mask catches the trick immediately — she is not failing to look relaxed, she is rationing panic with professional discipline. Whatever she sells online, tonight she is doing customer service for fear. # speaker: insight:mask
- else:
    She looks composed right up until you notice how often her eyes flick back to the same corner of the square.
}
"If you're actually CID," she says without looking at you, "either stand here and look useful or keep walking before he notices I've noticed him." # speaker: npc:ophelia
You take the spot beside her bench. Across the square, a man with a takeaway cup and all the patience in the world decides not to come any closer. # background: turtleLakePlaza
"Thank you," she says after a beat, like the phrase costs her. "That's already more than most of my audience has managed." # speaker: npc:ophelia
"Ophelia. Which is the name people here know, before you ask whether it's the legal one." Her mouth twitches, not quite a smile. "He's been following me off-feed. Places I never tagged. Streets I never stream. Tonight's just the first night he's gotten brave about it." # speaker: npc:ophelia
~ adjust_affinity("ophelia", 1)
-> END

=== ophelia_topics ===
{ affinity_ophelia >= 3:
    Ophelia glances over as you approach, then lets the posture drop half an inch. "Detective. Good. You look expensive enough to discourage amateurs." # speaker: npc:ophelia
- else:
    Ophelia tips her chin toward the empty space beside her. "Back again. Either you're curious or my life has suddenly become your problem." # speaker: npc:ophelia
}
* [Ask what exactly she sells online. # insight: ledger]
    "Mood, mostly. Access. A version of District 3 people can subscribe to without ever sweating through it." She folds one lace sleeve back over her wrist. "Some private messages. Some paid streams. Some men with too much money paying to feel specially misunderstood." # speaker: npc:ophelia
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_topics
* [Ask what the stalker knows that he should not. # insight: static]
    "My walk home when I don't broadcast it. Which back stair at Pasteur Street staff actually uses. The tea stall I stop at when I'm too tired to pretend I still want bourbon." Her expression goes flat. "Things a follower should only know if someone sold them, or if he did the work himself." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_topics
* [Ask why she has not gone through official channels. # insight: hustle]
    "Because official channels hear 'minor feed girl with paying clients' and stop listening after the noun." She watches the crowd instead of you. "And because a report is still a report, Detective. Names get written down. Some of mine can't afford that." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_topics
* [Ask if Ophelia is her real name. # insight: mask]
    "Real enough to get paid under. Real enough to hear shouted across a room by strangers who think they know me." She finally looks at you properly. "The birth-certificate answer is for people I trust, and you're not there yet." # speaker: npc:ophelia
    -> ophelia_topics
+ [Leave her to the crowd.]
    "Try not to arrest any of my customers unless they deserve it," Ophelia says, which in District 3 narrows absolutely nothing. # speaker: npc:ophelia
    -> END
