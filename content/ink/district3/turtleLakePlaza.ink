// Turtle Lake Plaza (src/content/locations.ts, LocationId 'turtleLakePlaza') —
// District 3's civic anchor, per the vault's District 3 file: a fountain
// square that's been a citadel gate, a colonial water tower, and a
// diplomatic monument in turn, now just where the district's actual
// nightlife happens. Optional city-life location (same status as
// content/ink/district4/workerCanteen.ink), not real Case 1 content.

EXTERNAL adjust_affinity(npcId, amount)
EXTERNAL start_case(caseId)
EXTERNAL complete_case_objective(caseId, objectiveId)
EXTERNAL is_objective_complete(caseId, objectiveId)
EXTERNAL set_case_flag(flag)
EXTERNAL has_case_flag(flag)
EXTERNAL unlock_note(noteId)

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
"If you're actually CID," she says without looking at you, "either stand here and look useful or keep walking before he notices I've noticed him. I don't have the bandwidth to train a badge tonight." # speaker: npc:ophelia
You take the spot beside her bench anyway. Across the square, a man with a takeaway cup and all the patience in the world decides not to come any closer. # background: turtleLakePlaza
"Thank you," she says after a beat, like the word costs her something she'd rather not spend on you specifically. "Don't get used to it. I say thank you to delivery drivers too." # speaker: npc:ophelia
"Ophelia. Which is the name people here know, so it's the one you get." Her mouth twitches, not quite a smile. "I picked this exact swamp of a district specifically so nobody who pays to watch me would ever bother showing up in person. That was rather the whole plan. And now one of them has decided that money means he's owed the rest of me too — my street, my face, whatever's left of me that isn't already for sale." # speaker: npc:ophelia
~ adjust_affinity("ophelia", 1)
~ start_case("ophelia-stalker")
~ complete_case_objective("ophelia-stalker", "recognition")
-> END

=== ophelia_topics ===
// Gates checked in order, top to bottom, every time this knot is entered
// (docs/OPHELIA_LIVESTREAM_ARC_SPEC.md): once she's agreed to the stream
// favor she's relocated for good, so nothing below this point ever fires
// again for her at Turtle Lake. Refusing keeps her here, so the secondhand
// escalation beat fires here instead, once, before falling through to the
// ordinary greeting/topic loop below.
{ has_case_flag("ophelia-stream-agreed"):
    -> ophelia_relocated
}
{ has_case_flag("ophelia-stream-refused") and not has_case_flag("ophelia-pattern-told"):
    -> ophelia_pattern_secondhand
}
{ is_objective_complete("ophelia-stalker", "recognition") and affinity_ophelia >= 2 and not has_case_flag("ophelia-stream-asked"):
    -> ophelia_stream_ask
}
{ affinity_ophelia >= 3:
    Ophelia glances over as you approach, then lets the posture drop half an inch — not enough that anyone else at the fountain would clock it. "Detective. Good. You're almost interesting enough to justify the seat." # speaker: npc:ophelia
- else:
    Ophelia tips her chin toward the empty space beside her without really looking at you. "Back again. Either you're bored or my life has officially become your new hobby." # speaker: npc:ophelia
}
* [Sells online? # insight: ledger] "What exactly do you sell online?"
    "Fantasy, at a markup nobody asks to itemize." She examines a nail like the question bores her more than it should. "Private messages. Paid one-on-one streams. A very convincing illusion that whoever's paying that month is the only one who's ever really seen me." A beat. "I'm good at it. That's rather the entire problem." # speaker: npc:ophelia
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_topics
* [Why Saigon? # insight: root] "Why did you pick Saigon, of all places?"
    The brat drops for exactly one sentence. "Because nobody here was supposed to know my face." She recovers fast, like she's annoyed at herself for letting it show. "I built the account somewhere else, for people somewhere else. District 3 was the one place I was sure none of my actual audience would ever set foot in — no trade wealth, no off-world layover reason, nothing worth the airfare. I moved here to be nobody part-time. I did not account for one of them refusing to stay a paying stranger on a screen." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_topics
* [What he knows # insight: static] "What does the stalker know that he shouldn't?"
    "My walk home when I don't broadcast it. Which back stair at Pasteur Street staff actually uses. The tea stall I stop at when I'm too tired to perform still wanting bourbon." Her expression goes flat, all the brattiness burned off in one line. "Things a subscriber should only know if someone sold them to him, or if he did the tracing himself. I'd bet on the second one. He seems like the type who'd consider that romantic." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_topics
* [Official channels? # insight: hustle] "Why haven't you gone through official channels?"
    "Because official channels hear 'minor feed girl with paying clients' and stop listening after the noun." She watches the crowd instead of you. "And a report is still a report, Detective. Names get written down, and some of my names very much cannot survive that. So, no. I would rather handle this myself, thank you, except apparently I can't, which is exactly the part I resent." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_topics
* [Real name? # insight: mask] "Is Ophelia even your real name?"
    "Real enough to get paid under. Real enough to be shouted across a bar by strangers who've never once bought me a drink." She finally looks at you properly, and for a second the brat drops entirely. "The name on record is for people I trust. You are not there. Try not to take it personally — nobody is." # speaker: npc:ophelia
    -> ophelia_topics
+ [Leave her to the crowd.]
    "Try not to arrest any of my customers unless they deserve it," Ophelia says, already sounding like she owns the square again. "And eat something. You look like you skip meals for a hobby, and frankly it's distracting." # speaker: npc:ophelia
    -> END

// The Ask (docs/OPHELIA_LIVESTREAM_ARC_SPEC.md, Scene 1) — a forced beat,
// not a selectable topic, since she's the one bringing it up. Fires once
// (gated by ophelia-stream-asked) once she's told the detective why she's
// being followed and warmed up at least a little.
=== ophelia_stream_ask ===
Ophelia's already got her whole "casual" face on before you're within earshot — the loose posture people use to keep from asking for something they actually want. "Don't get comfortable. I need thirty seconds and mild cooperation, not a conversation." # speaker: npc:ophelia
"There's a thing. A stream thing. You'd stand somewhere with decent lighting and look mysterious, which I'm told you have some natural aptitude for." A pause, like she's deciding how much of the actual ask to let show. "It's not a big deal." # speaker: npc:ophelia
{ mask >= 3:
    The Mask isn't buying "not a big deal" for a second — that's a rehearsed opener, the kind you use right before the real number comes out. # speaker: insight:mask
- else:
    Something about how carefully she's not making eye contact says there's more to this than she's letting on.
}
"Fine. It's a slightly bigger deal." The brat cracks half an inch. "Numbers are down. Badly. The kind of down where the maths on rent starts getting creative." She catches herself saying it out loud and visibly hates that she did. "I need something that reads as new. You, apparently, read as new." # speaker: npc:ophelia
* [Ask what "helping" actually means. # insight: ledger]
    "On camera. My camera, my script, my audience — you're the mystery guest, not the headline. Cop who won't say why he's there, off the record, all very noir." She shrugs like it's nothing. It is not nothing, and you both know it. # speaker: npc:ophelia
    -> ophelia_stream_ask_decision
* [Ask why she's asking you, specifically. # insight: root]
    The brat drops for real this time. "Because I don't have a long list of people I'd trust to stand next to me on camera and not make it worse." She says it like it costs her something. "You're already the only cop who's treated this like it's actually happening to me. I'm not above using that." # speaker: npc:ophelia # portrait: guarded
    -> ophelia_stream_ask_decision

=== ophelia_stream_ask_decision ===
* [Agree. # insight: hustle]
    "Wonderful. Try to look like you have a personality." The relief under the sarcasm is almost visible. "My place. I'll send you the address once you're not standing in the middle of a public square." # speaker: npc:ophelia
    ~ set_case_flag("ophelia-stream-agreed")
    ~ set_case_flag("ophelia-stream-asked")
    ~ adjust_affinity("ophelia", 1)
    "Don't make this weird," she adds, already walking off before you can answer. "It's a favor. It is not a moment." # speaker: npc:ophelia
    -> END
* [Refuse, gently. # insight: root]
    "Forget it. Obviously it was a stupid thing to ask a cop." She's already turning back to the crowd, voice gone brisk and final, the sadness under it flickering for exactly one second before she buries it. "I'll figure something else out. I always do." # speaker: npc:ophelia # portrait: guarded
    ~ set_case_flag("ophelia-stream-refused")
    ~ set_case_flag("ophelia-stream-asked")
    -> ophelia_topics
* [Refuse, and name what she's doing. # insight: mask]
    "The sad act. I clocked it." She actually laughs, short and surprised, like she didn't expect you to say it out loud. "Fine. Guilty. Doesn't make the numbers less real, it just means you're annoyingly hard to work." She waves you off, more amused than stung. "No hard feelings, Detective. Mostly." # speaker: npc:ophelia
    ~ set_case_flag("ophelia-stream-refused")
    ~ set_case_flag("ophelia-stream-asked")
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_topics

// She's relocated for good once this fires — see the top-of-knot guard in
// ophelia_topics above. No topic loop here anymore, just a pointer to
// where she actually is now.
=== ophelia_relocated ===
Ophelia's bench by the fountain is somebody else's tonight — she's traded the crowd for four walls and a lock she controls, now that there's a reason to. If you need her, you know where to find her these days.
-> END

// Refused-path Pattern completion (Scene 3, secondhand variant) — fires
// once, the first time the player returns after refusing, then falls
// through into the ordinary greeting/topic loop above.
=== ophelia_pattern_secondhand ===
Ophelia's doing a passable impression of fine, right up until she isn't. "He sent something after the stream I did without you. Something that made it very clear he already knows there's a 'someone else' now, even though you were never anywhere near a camera." Her voice stays level in a way that costs her visible effort. "Coordinated. Real. Congratulations, you can stop pretending you weren't already sure." # speaker: npc:ophelia # portrait: guarded
{ mask >= 3:
    The Mask reads underneath the bitterness easily enough — she's not actually angry at you for saying no. She's furious that saying no didn't even buy her anything. # speaker: insight:mask
}
~ complete_case_objective("ophelia-stalker", "pattern")
~ unlock_note("note-06")
~ set_case_flag("ophelia-pattern-told")
-> ophelia_topics
