// Ophelia's Apartment (src/content/locations.ts, LocationId 'opheliaApartment')
// — a small District 3 rental she starts actually living out of once
// agreeing to help with a stream makes staying findable worth the
// risk. Locked on the Overworld until turtleLakePlaza.ink's
// ophelia_stream_ask knot sets `ophelia-stream-agreed`
// (docs/OPHELIA_LIVESTREAM_ARC_SPEC.md) — content/locations.ts's
// `unlocksOnFlag` on turtleLakePlaza is what actually flips the District 3
// street POI open once that flag lands.

EXTERNAL adjust_affinity(npcId, amount)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL set_case_flag(flag)
EXTERNAL has_case_flag(flag)
EXTERNAL is_objective_complete(caseId, objectiveId)
EXTERNAL complete_case_objective(caseId, objectiveId)
EXTERNAL complete_case(caseId)
EXTERNAL unlock_note(noteId)

VAR mask = 0
VAR ledger = 0
VAR hustle = 0
VAR affinity_ophelia = 0

// Gates checked in order, same convention as turtleLakePlaza.ink's
// ophelia_topics — the stream scene plays exactly once on first arrival
// unless they walk, the escalation beat plays exactly once on the visit
// after that (lived-through or secondhand), and only once both are behind
// you does this settle into an ordinary repeat-topics loop.
=== ophelia_apartment_topics ===
{ not has_case_flag("ophelia-stream-scene-done") and not has_case_flag("ophelia-stream-refused"):
    -> ophelia_stream_scene
}
{ has_case_flag("ophelia-stream-scene-done") and not is_objective_complete("ophelia-stalker", "pattern"):
    -> ophelia_pattern_livestream
}
{ has_case_flag("ophelia-stream-refused") and not is_objective_complete("ophelia-stalker", "pattern"):
    -> ophelia_pattern_walked
}
{ is_objective_complete("ophelia-stalker", "pattern") and not is_objective_complete("ophelia-stalker", "choice"):
    -> ophelia_choice_scene
}
{ has_case_flag("ophelia-ending-vanish"):
    Ophelia doesn't glance at a laptop that isn't open anymore. Without the account there's less to perform for, which means less performance, period — just her, in a room that's finally only hers. "Detective. Sit if you're staying. I'm re-learning what a day looks like without an audience in it, so bear with me." # speaker: npc:ophelia
- else:
    { has_case_flag("ophelia-ending-cold"):
        Ophelia doesn't look up from whatever she's scheduling. The warmth is still there, technically, filed somewhere she can access it on purpose instead of by accident. "Detective. I've got a booking in twenty. Say what you need to say." # speaker: npc:ophelia # portrait: guarded
    - else:
        { has_case_flag("ophelia-ending-public"):
            Ophelia's reading her own comments with the specific weariness of someone who won that fight and is still counting the cost of it. "Half my subscribers think I'm braver than I am. The other half think I'm insufferable now. Somehow both audiences are still paying, so." # speaker: npc:ophelia
        - else:
            { has_case_flag("ophelia-ending-drawnout"):
                Ophelia looks up at the door out of habit more than fear now — the flinch is fading, slower than she'd like to admit. "Detective. You're allowed to just visit occasionally, you know. It doesn't all have to be a debrief." # speaker: npc:ophelia
            - else:
                { affinity_ophelia >= 3:
                    Ophelia doesn't bother with the performance the second you're through the door — this room only has one audience worth managing, and it isn't you. "You're early. Or I'm behind. Pick whichever makes me sound less disorganized." # speaker: npc:ophelia
                - else:
                    Ophelia glances up from whatever she's doing to the ring light's angle and waves you further in without really looking. "Door's unlocked because I was expecting you, not because I've gotten careless." # speaker: npc:ophelia
                }
            }
        }
    }
}
* [The numbers, after # insight: ledger] "Did it actually help? The stream?"
    "Enough to matter. Not enough to fix anything permanently, which was never really the point, was it." She says it lightly, but doesn't quite meet your eyes doing it. "It bought me a month where I'm not doing the rent math at three in the morning. That's not nothing." # speaker: npc:ophelia
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_apartment_topics
* [Why here? # insight: root] "Why this place, specifically?"
    "Because it's mine. Because the landlord doesn't ask questions as long as the transfer clears. Because for the first time since I got here, somewhere with my actual address on it isn't a liability." She looks around the room like she's still getting used to that being true. "Don't get sentimental about it. It's a room." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_apartment_topics
* [Scared? # insight: static] "Does it worry you, him knowing you've got someone new around?"
    The brat drops out entirely, just for a second. "Every day. I don't say that out loud very often, so don't make a thing of it." She busies her hands with the ring light's stand, more for something to do than because it needs adjusting. "You're the first thing in a while that isn't purely a liability, and that terrifies me more than I want it to." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_apartment_topics
* { affinity_ophelia >= 5 } [Why you trust me # insight: mask] "You didn't have to let me in here. Why did you?"
    She's quiet a beat longer than the question should need. "Because everyone else who's ever been in this room paid to be here, one way or another. You didn't." A short, uncomfortable laugh. "I don't have a lot of practice with the other kind." # speaker: npc:ophelia # portrait: guarded
    ~ adjust_affinity("ophelia", 2)
    -> ophelia_apartment_topics
+ [Head out.]
    "Lock it behind you," Ophelia says, already back to whatever she was doing before you arrived. "And thank you. I'm allotting myself one of those a week, so don't get used to it." # speaker: npc:ophelia
    -> END

// Scene 2 (docs/OPHELIA_LIVESTREAM_ARC_SPEC.md) — plays exactly once, the
// first time the detective walks in after agreeing to help. The plaza ask
// was the polite version; this is the actual job. Walking here sets
// `ophelia-stream-refused` so Pattern still completes secondhand next visit.
=== ophelia_stream_scene ===
Her apartment is smaller than the persona and lit better than it has any right to be — a ring light, a rented-looking velvet backdrop doing its best to cover for the water stain behind it, a laptop propped on what might be the only sturdy furniture in the room. Ophelia is in the dress the camera likes, not the one the plaza got. She does not sit you down. # speaker: npc:ophelia # background: opheliaApartment
"Before you take another step. The fountain version was the polite version, and we're past polite." She tips her chin at the laptop. "I need a stunt cock. You stand where I put you. Face off-frame — I like your face, my audience doesn't get it. You don't perform. You don't talk. You don't look at the lens. I do the rest, on camera, with the part of you that reads as new." A beat, bratty on purpose. "You don't have to do anything. That's rather the point of a prop." # speaker: npc:ophelia
{ mask >= 3:
    Mask isn't surprised. "Look mysterious" was never the brief. It was the version of the brief you can say next to a fountain. # speaker: insight:mask
- else:
    The plaza version and this version are not the same job. She waited until the door was locked to say so.
}
* [Stand where she puts you. # check: red]
    She points you in — half a step off the backdrop, hips in the light, head out of it. The camera is already framed for a mouth and a cock and nothing a sergeant could identify in a still. "Live in ten. If you ruin my take I will never forgive you, and I am very good at not forgiving people." # speaker: npc:ophelia # portrait: performing
    The performance snaps on like a switch: warmer, filthier, aimed at the lens. "Hi. No, you're not getting a name. You don't pay enough for a name. You get this." # speaker: npc:ophelia # portrait: performing
    Her hand first — unfussy, checking the job is actually possible. Then she goes to the height the frame wants and takes you into her mouth with the competence of someone whose rent depends on looking like she's enjoying a choice. Heat, spit, the wet sound the laptop mic will sell as intimacy. She keeps a running line going around you — a hum, a pause, a look up at the chat and not at you — like you're a microphone she's using to talk to someone else. # speaker: npc:ophelia # portrait: performing
    ~ temp holdResult = roll_check("mask", 7, "ophelia-stream-hold-still", "red")
    { holdResult:
        You hold. Breath, hands, eyes — none of it enters her shot. She takes you deeper when the numbers twitch, backs off when she wants a sentence, uses her hand on what her mouth isn't doing, and when she decides the bit needs an ending she finishes you into her mouth on camera like that's just another line she wrote. She swallows because the chat pays more if she does. The performance doesn't flicker. After, she sits back, wipes her mouth with her thumb, and only then looks at you, still in character for one more second. "See? You did nothing. I told you you were qualified." # speaker: npc:ophelia # portrait: performing
        ~ adjust_affinity("ophelia", 2)
    - else:
        You look at the lens. Or you make a sound. Or your hand finds her hair like this is a scene you're in instead of a prop she's using. She doesn't stop. She turns her shoulder into the frame so your face dies in shadow and laughs around you, messy, selling it: "he's new. we're workshopping him." It costs her a stroke of the bit and she takes it out of you anyway — same ending, same swallow, slightly worse angle, numbers still climbing because unpolished reads as real to the kind of men who pay her. When she sits back her eyes are sharp. "I said don't look at the camera. That was the whole job." # speaker: npc:ophelia # portrait: performing
        ~ adjust_affinity("ophelia", 1)
    }
    ~ set_case_flag("ophelia-stream-scene-done")
    -> ophelia_stream_scene_wrap
* [I'm not doing this. # insight: root]
    "Forget it. Obviously it was a stupid thing to ask a cop." She's already turning toward the laptop, voice gone brisk and final, the sadness under it flickering for exactly one second before she buries it. "I'll do it without you. I always do." # speaker: npc:ophelia # portrait: guarded
    ~ set_case_flag("ophelia-stream-refused")
    -> END
* [You sandbagged me. # insight: mask]
    "The fountain version. I clocked it." She actually laughs, short and surprised, like she didn't expect you to say it out loud in the room where the lie ran out. "Fine. Guilty. Doesn't make the numbers less real, it just means you're annoyingly hard to work." She waves you at the door, more amused than stung. "No hard feelings, Detective. Mostly. Lock it." # speaker: npc:ophelia
    ~ set_case_flag("ophelia-stream-refused")
    ~ adjust_affinity("ophelia", 1)
    -> END

=== ophelia_stream_scene_wrap ===
She cuts the feed, and the performance drops off her like a coat coming off. "Don't make this weird," she says, though she's smiling despite herself. "It's a favor. It is not a moment." She's already checking the numbers again, and doesn't quite manage to hide that she's pleased with them. # speaker: npc:ophelia
-> END

// Scene 3, agreed variant (docs/OPHELIA_LIVESTREAM_ARC_SPEC.md) — the visit
// after the stream, not the same one; the top-of-knot guard above only
// reaches this once ophelia-stream-scene-done is already set, which means
// the player left and came back.
=== ophelia_pattern_livestream ===
Ophelia's phone is already face-down on the counter when you walk in, which is its own answer. # background: opheliaApartment
"He watched. Of course he watched." She doesn't bother with the brat voice this time. "Not the face — you kept that off-frame, I made sure — the rest of you. He wanted a name for that. Whether I'd 'replaced' him with a body he doesn't get to have." She sets the phone down harder than it needs. "That's not a fan reacting to content, Detective. That's someone keeping a file." # speaker: npc:ophelia # portrait: guarded
~ complete_case_objective("ophelia-stalker", "pattern")
~ unlock_note("note-06")
-> ophelia_apartment_topics

// Walked-at-the-door Pattern completion — she did the stream without you
// after you saw the real ask and left. Same objective, colder texture,
// apartment stays unlocked because the address is already spent.
=== ophelia_pattern_walked ===
Ophelia's doing a passable impression of fine, right up until she isn't. The ring light is off. The laptop isn't. "He sent something after the stream I did without you. Same as he always does when I go live. Coordinated. Real." Her voice stays level in a way that costs her visible effort. "Congratulations, you can stop pretending you weren't already sure. You can also stop looking at me like I owe you a softer version of the question I actually asked." # speaker: npc:ophelia # portrait: guarded
{ mask >= 3:
    The Mask reads underneath the bitterness easily enough — she's not actually angry at you for saying no in the room. She's furious that saying no didn't even buy her anything. # speaker: insight:mask
}
~ complete_case_objective("ophelia-stalker", "pattern")
~ unlock_note("note-06")
-> ophelia_apartment_topics

// Scene 4 — Choice (docs/OPHELIA_CHARACTER_SPEC.md, "Story use" stage 3;
// closes the ophelia-stalker case). Fires once, the first visit after
// Pattern is confirmed, same forced-beat convention as ophelia_stream_ask.
// Four endings, matching the character spec's "Potential ending shapes" in
// order — no check gates which one the player picks, since this is a
// values call, not a skill check; only the "draw him out" branch itself
// carries a Red check, since that's the one branch that's actually
// detective work rather than a judgment call.
=== ophelia_choice_scene ===
Ophelia's not performing when you walk in this time. The ring light's off, the laptop's shut, and she's just sitting with her knees pulled up like the apartment finally got too small for the person she usually plays in it. "He's not a bad fan. We both know that now." She doesn't look up right away. "So tell me what I actually do about it, Detective. Because I've been making that call alone since before you were part of my life, and for once I'd like to hear it out loud before I decide." # speaker: npc:ophelia # portrait: guarded
{ mask >= 3:
    The Mask reads past the calm easily enough — this isn't her asking permission. It's her needing to say the options out loud to someone before she can pick one and live with it. # speaker: insight:mask
}
* [Let me handle him. Quietly. # check: red]
    "Handle him. Very reassuring, very specific." She doesn't stop you, though — that's the tell. "Fine. Do whatever it is cops do that isn't paperwork. Just don't make it worse than it already is." # speaker: npc:ophelia
    ~ temp drawResult = roll_check("static", 7, "ophelia-choice-draw-out", "red")
    { drawResult:
        It takes two days and a favor you'll be paying off for months, but it works — cleanly enough that he never sees your hand in it, badly enough that you both know "cleanly" is doing a lot of work in that sentence. He goes quiet. Not caught, not charged, just gone, the way problems this city can't officially see are made to disappear. Ophelia doesn't ask what it cost you. She's smart enough not to want the answer. # speaker: npc:ophelia
        ~ adjust_affinity("ophelia", 2)
    - else:
        You lean on the wrong lever, or the right one too hard, and instead of folding he goes dark — no more messages, no more sightings, nothing left to track, which should feel like a win and doesn't. Ophelia says thank you anyway, because you tried, but neither of you believes "gone quiet" and "gone" are the same thing. # speaker: npc:ophelia
        ~ adjust_affinity("ophelia", 1)
    }
    ~ set_case_flag("ophelia-ending-drawnout")
    -> ophelia_choice_resolved
* [Go public. Burn him in front of everyone who's watching. # insight: hustle]
    "Turn my own audience into a weapon." She says it slowly, testing the shape of it. "It could work. It could also cost me half of them — the ones who decide a woman with a stalker story is bad for the vibe." A short, humorless laugh. "Let's find out which half." # speaker: npc:ophelia
    She posts it herself that night — careful, specific, naming the pattern without naming a name the platforms can't verify. It works exactly as well and as badly as she predicted: solidarity from strangers who've dealt with their own, a wave of quiet unsubscribes from people who liked her better decorative than real, and total, permanent silence from him. He doesn't vanish. He just can't risk being anywhere near this version of the story anymore. # speaker: npc:ophelia # portrait: guarded
    ~ set_case_flag("ophelia-ending-public")
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_choice_resolved
* [Disappear. Shut the whole account down. # insight: root]
    "Give it up." Not a question, just her turning the sentence over like it belongs to someone else. "The rent, the persona, four years of building an audience that only exists because I kept showing up for it. Just — stop." # speaker: npc:ophelia
    She does it within the week, faster than either of you expects, like she'd already half-packed the decision and just needed someone to agree it was allowed. The account goes dark. The rent gets harder, not easier — safety costs money too, it turns out, just a different kind. But for the first time since the stalker found her, nobody on this earth knows where Ophelia actually is except you, and the handful of people she's decided to trust with it. # speaker: npc:ophelia # portrait: guarded
    ~ set_case_flag("ophelia-ending-vanish")
    ~ adjust_affinity("ophelia", 1)
    -> ophelia_choice_resolved
* [Stay visible. Just build the walls higher. # insight: ledger]
    "Keep going. Just — smarter." She's already doing the math out loud: paid security for in-person bookings, a delay on anything that reveals a real location, no more "authentic" anything that isn't scripted three drafts in advance. "I liked being a little bit real online. I don't think I get to anymore." # speaker: npc:ophelia
    It works, in the sense that the numbers hold and he never gets close again. It also means the Ophelia you first sat next to at the fountain — bratty, unguarded in the ways that mattered, capable of being talked into a favor — gets quietly retired along with the risk. What's left is very good at her job and a great deal harder to reach, you included. # speaker: npc:ophelia # portrait: guarded
    ~ set_case_flag("ophelia-ending-cold")
    ~ adjust_affinity("ophelia", -1)
    -> ophelia_choice_resolved

=== ophelia_choice_resolved ===
~ complete_case_objective("ophelia-stalker", "choice")
~ complete_case("ophelia-stalker")
~ unlock_note("note-07")
-> ophelia_apartment_topics

=== ophelia_apartment_corner ===
Up close the "set" is cheaper than it plays on camera — a backdrop clipped to a curtain rod, a ring light on a stand that's been glued back together at least once, a laptop with more browser tabs open than any one job should need.
{ ledger >= 3:
    The Ledger prices the whole setup at less than a week of what one good night probably brings in — everything here is built to look expensive on camera and cost as little as possible in the room. # speaker: insight:ledger
- else:
    It looks more expensive on a screen than it does standing this close to it.
}
{ hustle >= 3:
    Hustle clocks the folder of printed notes half-hidden under the laptop — audience names, spending patterns, the kind of tracking most performers do in their heads. She's running this like a real business, alone, without anyone to split the workload. # speaker: insight:hustle
- else:
    A folder of notes sits half-hidden under the laptop. You don't get a good look at what's in it.
}
* [Leave it alone.]
    -> ophelia_apartment_corner_done

=== ophelia_apartment_corner_done ===
-> END
