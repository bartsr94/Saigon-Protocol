// SEZ Checkpoint (src/content/locations.ts) — flavor-light placeholder scene,
// not real GDD content (docs/GAME_GUIDE.md). Exercises a Red
// check inline, per this location's own content.

EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL gain_evidence(id)
EXTERNAL unlock_note(id)
EXTERNAL unlock_thought(id)
EXTERNAL has_thought(id)
EXTERNAL adjust_affinity(npcId, amount)

VAR hustle = 0
VAR static = 0
VAR graft = 0
VAR ledger = 0
VAR affinity_lakshmi_avani = 0

The checkpoint queue barely moves. A bored guard waves cars through two at a time, more interested in his handheld than your badge.
{ hustle >= 3:
    The Hustle reads the guard's boredom as an opening — a story here could shave ten minutes off the wait. # speaker: insight:hustle
- else:
    You settle in for the wait like everyone else.
}

A mask-seal scanner and a ration-chit reader are bolted to the same post, badge check third in line. Nobody questions the order anymore.
{ static >= 3:
    Static clocks the scanner's little particulate readout ticking up before you even reach it — another bad-air day nobody's bothering to announce. # speaker: insight:static
- else:
    Just routine hardware, as far as you can tell.
}

A woman in Aveline colors clears the same post without slowing down — no mask-seal check, just a nod from the guard.
{ graft >= 3:
    Graft doesn't need the badge to place her — subdermal ports at the collar, skin that's never once burned under unfiltered sun. Whatever's sealed off past this checkpoint, she's not the kind of modified that queues for anything. # speaker: insight:graft
- else:
    Just someone who didn't have to wait, as far as you can tell.
}

Above the queue, a recruitment screen loops Terra Nova's pitch on a three-second cycle — lunar wage figures scrolling past the mask-seal readouts like just more processing data. EARTH IS HOME. THE FUTURE ISN'T HERE ANYMORE, it finishes, then starts again.
{ ledger >= 3:
    The Ledger's already subtracting before the loop resets — full board, filtered air, and a transit debt eating that multiple down to something a lot closer to Saigon scale. # speaker: insight:ledger
- else:
    Big numbers. Gone before you can read whatever's printed underneath them.
}

{ is_red_check_consumed("checkpoint-jump-queue"):
    You already tried that trick once today. Better not push it twice.
    -> done
- else:
    * [Try to talk your way to the front. # insight: hustle # check: red]
        ~ temp result = roll_check("hustle", 5, "checkpoint-jump-queue", "red")
        { result:
            The guard shrugs and waves you past the line. Small win — and close enough to the post terminal now to see the drone's patrol log still open on the screen, timestamps that don't match its route.
            ~ gain_evidence("drone-log")
            ~ unlock_note("note-01")
            ~ unlock_thought("checkpoint-improviser")
        - else:
            He doesn't even look up. "Back of the line."
        }
        -> done
    * [Just wait it out.]
        -> done
}

== done ==
Eventually the queue spits you through, badge scanned, no questions asked.
-> END

// Mei Hong's repeat-visit topic loop (UI_PASS_SPEC.md §4) — a separate
// entry point from the top-of-file flow above, only ever reached via
// storyStore.loadStory's entryKnot option once she's been met once. Every
// topic loops back here rather than reaching END, so the ink Story stays
// parked at this menu between visits; "Leave Conversation" is a TS-only
// action in ConversationScreen; it never advances this knot.
=== mei_hong_topics ===
Mei Hong gives you her attention again — patient, watchful, still deciding how much this room can afford to say out loud.
* [Ask about her role here. # insight: ledger]
    "Operations. I keep the lights on and the paperwork honest — most days." She doesn't quite meet your eyes on "honest."
    -> mei_hong_topics
* [Ask about the checkpoint queue outside. # insight: hustle]
    "Corporate optics. Aveline wants to look careful without slowing anyone down who actually matters." A small, tired smile. "You noticed."
    -> mei_hong_topics
* [Ask if she's worried about the investigation. # check: white]
    ~ temp worriedResult = roll_check("ledger", 6, "checkpoint-mei-hong-worried", "white")
    { worriedResult:
        Her composure slips half a second before she catches it. "Worried isn't the word I'd use. Careful, maybe."
    - else:
        "Worried?" A short laugh, too quick. "I don't have the luxury."
    }
    -> mei_hong_topics
* { is_red_check_consumed("checkpoint-jump-queue") } [Ask about the guard at the gate. # insight: static]
    "Him? He's not paid enough to care who's late." She glances toward the checkpoint. "Neither am I, most days."
    -> mei_hong_topics
* { has_thought("company-man-doubt") } [Ask her what "handled" usually means, around here. # insight: ledger]
    Mei Hong's expression doesn't change, but she takes a second longer to answer than she has for anything else. "It means someone decided it wasn't worth a second memo. That's all it ever means." # speaker: npc:meiHong
    -> mei_hong_topics
* [Ask where the rest of the staff are. # insight: ledger]
    "The lounge, mostly." She nods toward it without quite looking. "Everyone off the floor is parked in there until your people finish. Some of them will talk to you. Most of them don't know enough to be careful about it yet." # speaker: npc:meiHong
    -> mei_hong_topics

// Aveline Faculty Lounge sub-location (CASE_1_LOCATION_MATRIX.md's "Aveline
// Faculty Lounge") — reached via its own Hub POIs' `sceneKnot`/`topicsKnot`
// rather than this file's default top-level flow (LocationHubScreen.tsx's
// enterHubInteraction).

// Lakshmi Avani's first encounter. Falls through to -> END (not into her
// topics loop) so DialogueScreen's finalizeEndedScene() actually marks her
// met — see storyStore.ts's `activeNpcId` / LocationHubScreen's `sceneKnot`.
=== lakshmi_avani_intro ===
The lounge smells like cold coffee and an overworked vending machine. A woman in a lab coat looks up from a shift roster taped crooked to the wall — visibly relieved to have someone to talk to who isn't wearing a CID uniform.
{ ledger >= 3:
    The Ledger clocks the coat, the badge, the roster she's still holding — junior enough to still be doing her own paperwork, senior enough that Aveline trusts her near a subject file. # speaker: insight:ledger
- else:
    Just a lab coat and a roster, as far as you can tell.
}

"Lakshmi Avani. Bio-engineering." She offers a hand, then seems to remember she's not sure that's allowed right now, and just nods instead. "Everyone's parked in here until your people finish with the floor. Ask me anything — I don't think I know enough to get in trouble for it." # speaker: npc:lakshmiAvani
~ adjust_affinity("lakshmiAvani", 1)
-> END

// Repeat-visit topic loop (same pattern as mei_hong_topics above). Staged
// by casefile/relationship progress rather than flat from the first visit
// (CASE_1_CAST_SPEC.md's Lakshmi entry) — the base three topics are always
// available and nudge affinity_lakshmi_avani a little on pick
// (Architecture §14, GAME_GUIDE.md §10); the last three only appear once
// she's said enough, or warmed up enough, to say them.
=== lakshmi_avani_topics ===
// Entry greeting, staged across her full affinity range so every visit
// reads her current standing with the detective before a single topic is
// picked (CASE_1_CAST_SPEC.md's warmth arc — intimidated-then-easy,
// planted-but-unresolved). Thresholds match GAME_GUIDE.md §10's tiers with
// an extra split top and bottom for a gradual crossing rather than a jump.
{ affinity_lakshmi_avani >= 10:
    Lakshmi's whole posture changes when she spots you — she drops the roster and crosses half the room to meet you partway. "You actually came back." She says it like she's still getting used to being glad about that. # speaker: npc:lakshmiAvani
}
{ affinity_lakshmi_avani >= 8 and affinity_lakshmi_avani < 10:
    Lakshmi's already smiling before you're through the door, the kind she isn't bothering to manage anymore. "There you are." It sounds more like relief than habit. # speaker: npc:lakshmiAvani
}
{ affinity_lakshmi_avani >= 6 and affinity_lakshmi_avani < 8:
    Lakshmi looks up and the guardedness is just gone, like she stopped bracing for this to go badly a while ago. "Good. I was hoping it'd be you today." # speaker: npc:lakshmiAvani
}
{ affinity_lakshmi_avani >= 5 and affinity_lakshmi_avani < 6:
    Lakshmi's eyes light up when she sees you, and she sets aside her work immediately. "I was hoping you'd stop by today. There's something I've been meaning to tell you." # speaker: npc:lakshmiAvani
}
{ affinity_lakshmi_avani >= 4 and affinity_lakshmi_avani < 5:
    Lakshmi looks up before you've even finished crossing the room — something almost like ease in it now. "Back already?" She sounds pleased about it, not just surprised. # speaker: npc:lakshmiAvani
}
{ affinity_lakshmi_avani >= 2 and affinity_lakshmi_avani < 4:
    Lakshmi looks up and manages something closer to a real greeting than a flinch. "Oh — hi. Sorry, I wasn't sure you'd be back." # speaker: npc:lakshmiAvani
}
{ affinity_lakshmi_avani >= 0 and affinity_lakshmi_avani < 2:
    Lakshmi looks up from whatever she's pretending to read, straightening a little too fast. "Back already?" She says it like she's still not sure how she's supposed to act around you. # speaker: npc:lakshmiAvani
}
{ affinity_lakshmi_avani >= -5 and affinity_lakshmi_avani < 0:
    Lakshmi doesn't get up this time. She glances over just long enough to confirm it's you, then goes back to the roster. "Did you need something else." Not really a question. # speaker: npc:lakshmiAvani
}
{ affinity_lakshmi_avani < -5:
    Lakshmi doesn't look up at all until you're standing right in front of her, and even then it's brief. "I've told you what I know." Her voice has gone flat, professional, closed. # speaker: npc:lakshmiAvani
}
* [Ask what she actually works on. # insight: graft]
    "Adaptive physiology — how far a body can be pushed to tolerate the outside before it stops being survivable. That's the polite version, anyway." She doesn't offer the impolite one. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* [Ask if anything about the case has surprised her. # check: white]
    ~ temp surprisedResult = roll_check("ledger", 6, "checkpoint-lakshmi-surprised", "white")
    { surprisedResult:
        Her hands go still on the roster. "I flagged an adaptation-stress reading a few weeks back. Filed it, followed up, was told it was handled." A beat. "I didn't ask what 'handled' meant. I should have." # speaker: npc:lakshmiAvani
        ~ unlock_note("note-03")
        ~ unlock_thought("company-man-doubt")
        ~ adjust_affinity("lakshmiAvani", 2)
    - else:
        "Surprised isn't the word." She goes back to the roster before she says more than that. # speaker: npc:lakshmiAvani
    }
    -> lakshmi_avani_topics
* [Ask how morale is holding up. # insight: hustle]
    "About how you'd expect. Half this room is deciding whether to update their resume tonight or wait for the weekend." A tired almost-smile. "I haven't decided either." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* { has_thought("company-man-doubt") and not is_red_check_consumed("checkpoint-lakshmi-colleague") } [Push her on who else saw this coming. # insight: root # check: red]
    ~ temp colleagueResult = roll_check("root", 7, "checkpoint-lakshmi-colleague", "red")
    { colleagueResult:
        She doesn't answer right away — long enough that the silence is the answer. "There's someone who flagged worse than I did, earlier than I did, and said so out loud instead of just filing it." Her jaw tightens. "I'm not giving you a name. Not like this. You'd need more than asking nicely." # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", 1)
    - else:
        Something in her closes off. "I've already said more than I should have." She doesn't pick the thread back up, and doesn't quite look at you for the rest of the visit. # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", -1)
    }
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 3 } [Ask what she does when she's not down here. # insight: root]
    "Same as everyone in a hab block, probably. I've got a window box that's somehow still growing something green, and a downstairs neighbor who thinks I don't know she borrows my hotplate." A real laugh, the first unguarded one you've heard from her. "It's not much. It's mine, though." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 5 } [Ask if she's ever thought about leaving Aveline. # insight: ledger]
    She glances around the lounge before answering, voice dropping. "Sometimes. But where would I go? Terra Nova's always hiring, but their screening process... let's just say they're thorough about who they let off-world." A pause. "And honestly? I still believe in the work. Just not always the people running it." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 5 } [Mention you've noticed she's been more open lately. # insight: static]
    "Have I?" She considers this, then nods slowly. "I suppose I have. It's... easier, talking to you. Feels less like I'm being assessed and more like I'm actually being heard." She gives a small, genuine smile. "That's rare around here." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 5 } [Suggest going somewhere more private to talk. # insight: static]
    Lakshmi's eyes widen slightly, then she glances around the lounge. After a moment, she nods. "There's a supply closet down the hall that's usually empty this time of day. Follow me." She leads you out of the lounge, her steps quick and quiet. # speaker: npc:lakshmiAvani
    -> lakshmi_avani_private
* { affinity_lakshmi_avani >= 6 } [Tell her you're glad the lounge has her in it. # insight: root]
    That actually gets a blush out of her — fast, and she covers it by pretending to fix the roster's crooked tape. "That's — " A beat. "You're allowed to say things like that to a witness?" She's smiling when she says it, though. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics

=== lakshmi_avani_private ===
The supply closet is cramped, lit by a single flickering LED strip. Boxes of lab supplies line the shelves, and the air smells of disinfectant and dust. Lakshmi leans against a stack of crates, her posture more relaxed than you've ever seen it in the lounge.

"It's quieter here," she says, her voice softer. "Sometimes I come here just to think. Away from the eyes, you know?" She looks at you, really looks, without the usual professional guard. "What did you want to talk about?"

* [Ask about her dreams, not just her work. # insight: root]
    "Dreams?" She lets out a soft breath. "I used to want to see Earth. Not through a screen or in a history file — the real thing. Green grass, open sky... But then I realized I'm helping build the future here, even if it's messy." She smiles, a bit sadly. "Maybe that's enough." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 2)
    -> lakshmi_avani_private_end

* [Ask if she's ever been this open with anyone else at Aveline. # insight: ledger]
    "No." The answer comes immediately, certain. "Everyone here is either climbing or clinging. It's hard to know who to trust." She meets your eyes. "You're different. You listen without waiting for your turn to speak." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 2)
    -> lakshmi_avani_private_end

* [Ask what she wanted to tell you earlier. # insight: static]
    She hesitates, then leans closer. "There are... discrepancies in the adaptation logs. Things that don't add up. I've been compiling them privately." Her voice drops to a near-whisper. "I could show you, if you're willing to be careful about it." # speaker: npc:lakshmiAvani
    ~ unlock_note("note-05")
    ~ adjust_affinity("lakshmiAvani", 3)
    -> lakshmi_avani_private_end

* [Tell her she can trust you with anything. # insight: root]
    Her eyes search yours for a long moment. "I know," she says quietly. "That's what scares me. And... that's why I asked you here." She takes a small step closer. "Sometimes trust feels like the most dangerous thing in this place." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 3)
    -> lakshmi_avani_private_end

* [Just stand here with her in the quiet. # insight: static]
    You don't say anything. Neither does she. For a long moment, the only sound is the hum of the LED strip and the distant murmur of the lounge through the walls. She reaches out, her fingers brushing yours briefly before she pulls back, a faint blush on her cheeks. "We should probably get back before someone notices." But she doesn't move right away. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 3)
    -> lakshmi_avani_private_end

* { affinity_lakshmi_avani >= 7 } [Ask if she'd like to do something more... intimate. # insight: static]
    She freezes for a second, her breath catching. The flickering light casts sharp shadows across her face as she searches your expression. After a long pause, she swallows hard. "I—I shouldn't. We shouldn't." Her voice is barely above a whisper, but there's a tremor in it that wasn't there before. "But God, I want to." She glances at the door, then back at you, her fingers twisting in the fabric of her lab coat. "If we're caught... it's not just my job. It's everything." # speaker: npc:lakshmiAvani
    * [Press her, gently. # insight: hustle]
        You step closer, close enough to feel the heat of her body. "No one has to know," you murmur. "Just us. Right here." Your hand brushes against hers, and this time she doesn't pull away. Instead, her fingers curl around yours, hesitant but warm. "You're sure?" she asks, her voice unsteady. When you nod, she exhales shakily. "Okay. But we have to be quick." She turns, pressing her back against the crates, her eyes locked on yours. # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", 4)
        -> lakshmi_avani_blowjob
    * [Respect her hesitation. # insight: root]
        You nod, giving her space. "You're right. It's not worth the risk." The tension in her shoulders eases slightly, but there's a flicker of something—disappointment?—in her eyes before she looks away. "Maybe... another time," she says quietly. "When things aren't so complicated." She straightens her coat, smoothing out the wrinkles. "We should get back." # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", 2)
        -> lakshmi_avani_private_end
    * [Tease her, playfully. # insight: graft]
        You smirk, leaning in just enough to let your breath ghost over her ear. "Scared, Doctor?" The nickname rolls off your tongue, deliberate. She shivers, and you catch the way her pupils dilate. "I don't scare easy," she retorts, but her voice is breathier than before. You chuckle, low and quiet. "Prove it." That does it. She grabs the front of your shirt, pulling you against her, her mouth crashing into yours. It's messy, desperate, and over too soon—she pulls back with a gasp, her lips swollen. "Fuck," she breathes. "We really shouldn't." But she doesn't let go. # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", 5)
        -> lakshmi_avani_blowjob

=== lakshmi_avani_blowjob ===
Lakshmi drops to her knees in front of you, her hands trembling as they work at your belt. The flickering LED strip above casts jagged shadows across her face, but her eyes never leave yours. "I—I've never done this here before," she admits, her voice barely audible over the hum of the light. "I don't know if I'm any good at it."

* [Encourage her. # insight: root]
    You brush your fingers through her hair, tilting her face up gently. "You don't have to be good," you murmur. "Just be here with me." She swallows hard, then nods, her hands finally freeing you. Her touch is hesitant at first, exploratory, but when you let out a low groan, her confidence seems to grow. She takes you in her mouth slowly, her tongue swirling around the tip before she takes more of you in. The heat of her mouth is almost too much, and you have to bite back a curse. "Fuck, that's—" You cut yourself off, not wanting to break the moment. She pulls back just enough to smirk up at you. "Good?" she asks, her voice teasing. Before you can answer, she takes you deep again, her hands working in tandem with her mouth. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 4)
    -> lakshmi_avani_blowjob_end
* [Let her take control. # insight: static]
    You lean back against the crates, letting her set the pace. She seems to appreciate the trust—her movements become surer, more deliberate. She starts slow, her tongue tracing patterns along your length before she takes you deeper. Her free hand slides up your thigh, nails digging in just enough to make you hiss. "You like that?" she asks, pulling back just enough to speak. You can only nod, and she grins, wicked and knowing. "Good." She goes back to work, her mouth hot and wet, her hand following the rhythm of her lips. You thread your fingers through her hair, not guiding, just holding on. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 4)
    -> lakshmi_avani_blowjob_end
* [Push her further. # insight: hustle]
    You grip her hair a little tighter, not enough to hurt, but enough to let her know you're in charge. "Open wider," you command, your voice rough. She obeys without hesitation, her lips parting as she takes you deeper. You can feel her throat relax around you, and the sensation is almost too much. "That's it," you murmur. "Just like that." She moans around you, the vibration sending a jolt of pleasure through your body. Her hands grip your thighs, her nails digging in as she works you over, her mouth and tongue relentless. You can feel yourself getting close, and you tug her hair gently. "I'm gonna—" You don't get to finish the sentence. She pulls back just enough to look up at you, her lips swollen and glistening. "Do it," she says, her voice a challenge. "I want to taste you." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 5)
    -> lakshmi_avani_blowjob_end

=== lakshmi_avani_blowjob_end ===
Lakshmi pulls away slowly, wiping her mouth with the back of her hand. She looks up at you, her cheeks flushed, her breath coming in short gasps. "We—we should probably get back," she says, but there's no real urgency in her voice. She stands, smoothing down her lab coat with shaky hands. "That was..." She trails off, searching for the right word. "Intense."

* [Thank her. # insight: root]
    You tuck yourself back into your pants, then reach out to cup her face. "Thank you," you say softly. "That was... unexpected." She leans into your touch, her eyes closing for a brief moment. "Yeah," she whispers. "It was." She takes a deep breath, then steps back, putting some distance between you. "We should go. Before someone notices we're missing." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 3)
    -> lakshmi_avani_topics
* [Tease her. # insight: graft]
    You smirk, adjusting your belt. "Not bad, Doctor," you say, your voice light. "I think I'll keep you around." She rolls her eyes, but there's a smile playing at the corners of her mouth. "You're insufferable," she mutters, but she doesn't sound upset. "Come on. Let's get back before someone comes looking." She reaches for the door, but pauses, glancing back at you. "This doesn't change anything, you know." You raise an eyebrow. "Doesn't it?" She hesitates, then shakes her head. "No. It doesn't." But the way she says it, you're not so sure she believes it. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 4)
    -> lakshmi_avani_topics
* [Promise more later. # insight: static]
    You catch her hand before she can open the door, pulling her back against you. "This isn't over," you murmur against her ear. "Not by a long shot." She shivers, her body pressing into yours. "You're trouble," she says, but there's no real heat in it. "I know." You let her go, and she takes a deep breath, squaring her shoulders. "We should get back." She opens the door, stepping out into the hallway. You follow, the taste of her still on your lips. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 5)
    -> lakshmi_avani_topics

=== lakshmi_avani_private_end ===
Lakshmi takes a deep breath, straightening up. "Thank you for this. It... means a lot." She opens the door a crack, checking the hallway. Before stepping out, she turns back to you one last time. "Be careful out there. I'd... hate to lose this." The words hang in the air between you, more vulnerable than anything she's said before. # speaker: npc:lakshmiAvani
-> lakshmi_avani_topics

=== checkpoint_lounge_roster_wall ===
A shift roster taped to the wall, corners curling in the lounge's stale air — names, rotations, a scrawled note in the margin about a supply order nobody's approved yet. Half the names already have a line through them, today's date scratched in beside the strikethrough.
-> END
