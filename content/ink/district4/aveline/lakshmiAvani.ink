// Lakshmi Avani — Aveline District 4 Laboratory bio-engineer, met in the
// Aveline Faculty Lounge sub-location (CASE_1_LOCATION_MATRIX.md). INCLUDEd
// from content/ink/district4/checkpoint.ink, which owns the shared EXTERNAL
// declarations and the ledger insight VAR this file reads.

VAR affinity_lakshmi_avani = 0

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

// Repeat-visit topic loop (same pattern as mei_hong_topics). Staged
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
    Lakshmi's whole posture changes when she spots you — she drops the roster and crosses half the room to meet you partway. "You actually came back." She says it like she's still getting used to being glad about that. # speaker: npc:lakshmiAvani # portrait: love
}
{ affinity_lakshmi_avani >= 8 and affinity_lakshmi_avani < 10:
    Lakshmi's already smiling before you're through the door, the kind she isn't bothering to manage anymore. "There you are." It sounds more like relief than habit. # speaker: npc:lakshmiAvani # portrait: bright
}
{ affinity_lakshmi_avani >= 6 and affinity_lakshmi_avani < 8:
    Lakshmi looks up and the guardedness is just gone, like she stopped bracing for this to go badly a while ago. "Good. I was hoping it'd be you today." # speaker: npc:lakshmiAvani # portrait: bright
}
{ affinity_lakshmi_avani >= 5 and affinity_lakshmi_avani < 6:
    Lakshmi's eyes light up when she sees you, and she sets aside her work immediately. "I was hoping you'd stop by today. There's something I've been meaning to tell you." # speaker: npc:lakshmiAvani # portrait: warm
}
{ affinity_lakshmi_avani >= 4 and affinity_lakshmi_avani < 5:
    Lakshmi looks up before you've even finished crossing the room — something almost like ease in it now. "Back already?" She sounds pleased about it, not just surprised. # speaker: npc:lakshmiAvani # portrait: warm
}
{ affinity_lakshmi_avani >= 2 and affinity_lakshmi_avani < 4:
    Lakshmi looks up and manages something closer to a real greeting than a flinch. "Oh — hi. Sorry, I wasn't sure you'd be back." # speaker: npc:lakshmiAvani # portrait: warm
}
{ affinity_lakshmi_avani >= 0 and affinity_lakshmi_avani < 2:
    Lakshmi looks up from whatever she's pretending to read, straightening a little too fast. "Back already?" She says it like she's still not sure how she's supposed to act around you. # speaker: npc:lakshmiAvani # portrait: neutral
}
{ affinity_lakshmi_avani >= -5 and affinity_lakshmi_avani < 0:
    Lakshmi doesn't get up this time. She glances over just long enough to confirm it's you, then goes back to the roster. "Did you need something else." Not really a question. # speaker: npc:lakshmiAvani # portrait: guarded
}
{ affinity_lakshmi_avani < -5:
    Lakshmi doesn't look up at all until you're standing right in front of her, and even then it's brief. "I've told you what I know." Her voice has gone flat, professional, closed. # speaker: npc:lakshmiAvani # portrait: guarded
}
* [Ask what she actually works on. # insight: graft]
    "Adaptive physiology — how far a body can be pushed to tolerate the outside before it stops being survivable. That's the polite version, anyway." She doesn't offer the impolite one. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* [Ask if anything about the case has surprised her. # check: white]
    ~ temp surprisedResult = roll_check("ledger", 6, "checkpoint-lakshmi-surprised", "white")
    { surprisedResult:
        Her hands go still on the roster. "I flagged an adaptation-stress reading a few weeks back. Filed it, followed up, was told it was handled." A beat. "I didn't ask what 'handled' meant. I should have." # speaker: npc:lakshmiAvani # portrait: guarded
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
        She doesn't answer right away — long enough that the silence is the answer. "There's someone who flagged worse than I did, earlier than I did, and said so out loud instead of just filing it." Her jaw tightens. "I'm not giving you a name. Not like this. You'd need more than asking nicely." # speaker: npc:lakshmiAvani # portrait: guarded
        ~ adjust_affinity("lakshmiAvani", 1)
    - else:
        Something in her closes off. "I've already said more than I should have." She doesn't pick the thread back up, and doesn't quite look at you for the rest of the visit. # speaker: npc:lakshmiAvani # portrait: guarded
        ~ adjust_affinity("lakshmiAvani", -1)
    }
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 3 } [Ask what she does when she's not down here. # insight: root]
    "Same as everyone in a hab block, probably. I've got a window box that's somehow still growing something green, and a downstairs neighbor who thinks I don't know she borrows my hotplate." A real laugh, the first unguarded one you've heard from her. "It's not much. It's mine, though." # speaker: npc:lakshmiAvani # portrait: bright
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 5 } [Ask if she's ever thought about leaving Aveline. # insight: ledger]
    She glances around the lounge before answering, voice dropping. "Sometimes. But where would I go? Terra Nova's always hiring, but their screening process... let's just say they're thorough about who they let off-world." A pause. "And honestly? I still believe in the work. Just not always the people running it." # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 5 } [Mention you've noticed she's been more open lately. # insight: static]
    "Have I?" She considers this, then nods slowly. "I suppose I have. It's... easier, talking to you. Feels less like I'm being assessed and more like I'm actually being heard." She gives a small, genuine smile. "That's rare around here." # speaker: npc:lakshmiAvani # portrait: bright
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
+ { affinity_lakshmi_avani >= 5 } [Suggest going somewhere more private to talk. # insight: static]
    {Lakshmi's eyes widen slightly, then she glances around the lounge. After a moment, she nods. "There's a supply closet down the hall that's usually empty this time of day. Follow me." She leads you out of the lounge, her steps quick and quiet.|Lakshmi doesn't hesitate this time — just checks the hallway out of habit and tips her head toward the closet. "Same as before?" She's already moving before you answer.} # speaker: npc:lakshmiAvani # portrait: blush
    -> lakshmi_avani_private
* { affinity_lakshmi_avani >= 6 } [Tell her you're glad the lounge has her in it. # insight: root]
    That actually gets a blush out of her — fast, and she covers it by pretending to fix the roster's crooked tape. "That's — " A beat. "You're allowed to say things like that to a witness?" She's smiling when she says it, though. # speaker: npc:lakshmiAvani # portrait: blush
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics
* { affinity_lakshmi_avani >= 10 and not has_case_flag("checkpoint-inner-wing-unlocked") } [Ask her to help you get into the inner wing. # insight: root]
    Lakshmi goes quiet for a second, the kind of quiet that means she's already decided and is just bracing for it. "My badge still opens that door. Nobody's revoked it, they just stopped expecting me to use it." She sets the roster down like it matters less than it did a minute ago. "Come on. I'll walk you back myself." # speaker: npc:lakshmiAvani # portrait: love
    ~ set_case_flag("checkpoint-inner-wing-unlocked")
    ~ adjust_affinity("lakshmiAvani", 1)
    -> lakshmi_avani_topics

// A repeatable "repeat scene," not a topic loop of its own — each visit is
// still pick-one-and-leave (-> lakshmi_avani_private_end), but every choice
// here is sticky (+) rather than once (*), and its response text is an ink
// sequence alternative: {first-visit line|every-visit-after line}, so
// revisiting the closet plays a shorter, familiar variant instead of either
// vanishing the choice or replaying the original reveal verbatim.
=== lakshmi_avani_private ===
The supply closet is cramped, lit by a single flickering LED strip. Boxes of lab supplies line the shelves, and the air smells of disinfectant and dust. Lakshmi leans against a stack of crates, her posture more relaxed than you've ever seen it in the lounge. # portrait: vulnerable

"It's quieter here," she says, her voice softer. "Sometimes I come here just to think. Away from the eyes, you know?" She looks at you, really looks, without the usual professional guard. "What did you want to talk about?"

+ [Ask about her dreams, not just her work. # insight: root]
    {"Dreams?" She lets out a soft breath. "I used to want to see Earth. Not through a screen or in a history file — the real thing. Green grass, open sky... But then I realized I'm helping build the future here, even if it's messy." She smiles, a bit sadly. "Maybe that's enough."|"Still thinking about Earth?" She smiles faintly. "Some days more than others. Today's a green-grass kind of day, I think."} # speaker: npc:lakshmiAvani # portrait: vulnerable
    ~ adjust_affinity("lakshmiAvani", 2)
    -> lakshmi_avani_private_end

+ [Ask if she's ever been this open with anyone else at Aveline. # insight: ledger]
    {"No." The answer comes immediately, certain. "Everyone here is either climbing or clinging. It's hard to know who to trust." She meets your eyes. "You're different. You listen without waiting for your turn to speak."|"Still just you," she says, quieter this time. "That hasn't changed."} # speaker: npc:lakshmiAvani # portrait: vulnerable
    ~ adjust_affinity("lakshmiAvani", 2)
    -> lakshmi_avani_private_end

+ [Ask what she wanted to tell you earlier. # insight: static]
    {She hesitates, then leans closer. "There are... discrepancies in the adaptation logs. Things that don't add up. I've been compiling them privately." Her voice drops to a near-whisper. "I could show you, if you're willing to be careful about it."|"Same discrepancies," she says. "Still no closer to explaining them. I'll tell you the second that changes."} # speaker: npc:lakshmiAvani # portrait: vulnerable
    ~ unlock_note("note-05")
    ~ adjust_affinity("lakshmiAvani", 3)
    -> lakshmi_avani_private_end

+ [Tell her she can trust you with anything. # insight: root]
    {Her eyes search yours for a long moment. "I know," she says quietly. "That's what scares me. And... that's why I asked you here." She takes a small step closer. "Sometimes trust feels like the most dangerous thing in this place."|"I know," she says again, softer this time. "I still mean it, every time you say it."} # speaker: npc:lakshmiAvani # portrait: vulnerable
    ~ adjust_affinity("lakshmiAvani", 3)
    -> lakshmi_avani_private_end

+ [Just stand here with her in the quiet. # insight: static]
    {You don't say anything. Neither does she. For a long moment, the only sound is the hum of the LED strip and the distant murmur of the lounge through the walls. She reaches out, her fingers brushing yours briefly before she pulls back, a faint blush on her cheeks. "We should probably get back before someone notices." But she doesn't move right away.|Neither of you says anything this time either. It's easier now — less like holding your breath, more like just being somewhere quiet together.} # speaker: npc:lakshmiAvani # portrait: blush
    ~ adjust_affinity("lakshmiAvani", 3)
    -> lakshmi_avani_private_end

+ { affinity_lakshmi_avani >= 7 } [Ask if she'd like to do something more... intimate. # insight: static]
    {She freezes for a second, her breath catching. The flickering light casts sharp shadows across her face as she searches your expression. After a long pause, she swallows hard. "I—I shouldn't. We shouldn't." Her voice is barely above a whisper, but there's a tremor in it that wasn't there before. "But God, I want to." She glances at the door, then back at you, her fingers twisting in the fabric of her lab coat. "If we're caught... it's not just my job. It's everything."|She doesn't freeze this time — just glances at the door out of habit, the same old caution running more on reflex than fear now. "You're going to be the death of me," she murmurs, already closer than she was a second ago.} # speaker: npc:lakshmiAvani # portrait: blush
    ++ [Press her, gently. # insight: hustle]
        {You step closer, close enough to feel the heat of her body. "No one has to know," you murmur. "Just us. Right here." Your hand brushes against hers, and this time she doesn't pull away. Instead, her fingers curl around yours, hesitant but warm. "You're sure?" she asks, her voice unsteady. When you nod, she exhales shakily. "Okay. But we have to be quick." She turns, pressing her back against the crates, her eyes locked on yours.|You don't even have to say anything this time — she's already closing the distance, her hand finding yours like it's second nature now. "We really need to stop meeting like this," she breathes, not stopping at all.} # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", 4)
        -> lakshmi_avani_blowjob
    ++ [Respect her hesitation. # insight: root]
        {You nod, giving her space. "You're right. It's not worth the risk." The tension in her shoulders eases slightly, but there's a flicker of something—disappointment?—in her eyes before she looks away. "Maybe... another time," she says quietly. "When things aren't so complicated." She straightens her coat, smoothing out the wrinkles. "We should get back."|"Still the responsible one," she says, something warm under the dry tone. "One of us has to be, I suppose." She doesn't sound entirely sure she's grateful for it.} # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", 2)
        -> lakshmi_avani_private_end
    ++ [Tease her, playfully. # insight: graft]
        {You smirk, leaning in just enough to let your breath ghost over her ear. "Scared, Doctor?" The nickname rolls off your tongue, deliberate. She shivers, and you catch the way her pupils dilate. "I don't scare easy," she retorts, but her voice is breathier than before. You chuckle, low and quiet. "Prove it." That does it. She grabs the front of your shirt, pulling you against her, her mouth crashing into yours. It's messy, desperate, and over too soon—she pulls back with a gasp, her lips swollen. "Fuck," she breathes. "We really shouldn't." But she doesn't let go.|"Scared, Doctor?" you ask again, and this time she doesn't even bother pretending to be offended. "Terrified," she deadpans, and pulls you in herself before you can say another word.} # speaker: npc:lakshmiAvani
        ~ adjust_affinity("lakshmiAvani", 5)
        -> lakshmi_avani_blowjob

=== lakshmi_avani_blowjob ===
Lakshmi drops to her knees in front of you, the concrete floor cold and unforgiving under her. Her hands tremble as they work at your belt, fingers fumbling with the buckle like she’s never done this before—though the heat in her eyes says otherwise. The flickering LED strip above casts jagged shadows across her face, painting one cheek in harsh blue light while the other stays half-hidden in darkness. Her eyes never leave yours. “I—I’ve never done this here before,” she admits, her voice barely audible over the low electrical hum. “Not in a storage room. Not with the risk of someone walking in. I don’t know if I’m any good at it.” She swallows, the sound loud in the quiet space, and her tongue darts out to wet her lips. The lab coat hangs open just enough to show the soft curve of her collarbone, the rise and fall of her chest a little too quick.

* [Encourage her. # insight: root]
    You brush your fingers through her hair, slow and deliberate, tilting her face up gently until she’s forced to meet your gaze. “You don’t have to be good,” you murmur, thumb stroking along her cheekbone. “Just be here with me. That’s enough.” She swallows hard, a small, shaky breath escaping her, then nods. Her hands finally free you, the cool air of the room hitting skin that is already aching. Her touch is hesitant at first—exploratory, almost clinical—fingers tracing the length of you as if she’s mapping something she needs to understand. But when you let out a low groan, her confidence seems to grow. She leans in and takes you in her mouth slowly, lips sealing around the tip, tongue swirling once, twice, before she sinks lower. The heat of her mouth is almost too much; wet and tight and careful all at once. You have to bite back a curse, jaw clenched. “Fuck, that’s—” You cut yourself off, not wanting to break the fragile focus she’s found. She pulls back just enough to smirk up at you, lips already glistening. “Good?” she asks, her voice low and teasing, a little breathless. Before you can answer she takes you deep again, one hand wrapping the base while her mouth works in steady, deliberate strokes. The wet sound of it fills the small room, underscored by the soft, involuntary noises she makes when she goes a little too far and has to adjust. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 4)
    -> lakshmi_avani_blowjob_end
* [Let her take control. # insight: static]
    You lean back against the crates, shoulders settling into the rough wood, and let your hands fall open at your sides. No pressure. No direction. Just space for her to set the pace. She seems to appreciate the trust—her movements become surer, more deliberate, the earlier tremor fading. She starts slow, tongue tracing slow, deliberate patterns along your length, tasting, learning, before she takes you deeper in one smooth motion. Her free hand slides up your thigh, nails digging in just enough to make you hiss through your teeth. “You like that?” she asks, pulling back just enough to speak, a thin strand of saliva connecting her bottom lip to you for a second before it breaks. You can only nod. She grins, wicked and knowing, eyes half-lidded. “Good.” She goes back to work without another word, mouth hot and wet, hand following the rhythm of her lips in a perfect, devastating tempo. Every so often she looks up through her lashes, checking your face, adjusting pressure or speed based on the way your breath catches. You thread your fingers through her hair—not guiding, just holding on—feeling the soft pull every time she sinks lower. The world narrows to the heat of her mouth, the scrape of her nails, and the quiet, focused sounds she makes as she takes you apart. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 4)
    -> lakshmi_avani_blowjob_end
* [Push her further. # insight: hustle]
    You grip her hair a little tighter, not enough to hurt, but enough to let her know you’re in charge. The strands slide between your fingers as you tilt her head just so. “Open wider,” you command, voice rough. She obeys without hesitation, lips parting, eyes fluttering shut for a second as she takes you deeper. You can feel her throat relax around you—slow, deliberate, a conscious effort—and the sensation is almost too much. “That’s it,” you murmur, thumb brushing the hinge of her jaw. “Just like that.” She moans around you, the vibration sending a sharp jolt of pleasure straight through your spine. Her hands grip your thighs hard enough to leave crescents, nails biting through fabric as she works you over, mouth and tongue relentless. Every time she pulls back for air she goes right back down, taking a little more, pushing herself. You can feel yourself getting close, the pressure building too fast, and you tug her hair gently in warning. “I’m gonna—” You don’t get to finish the sentence. She pulls back just enough to look up at you, lips swollen, chin wet, eyes dark and challenging. “Do it,” she says, voice a low rasp. “I want to taste you. Don’t hold back.” The way she says it leaves no room for argument. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 5)
    -> lakshmi_avani_blowjob_end

=== lakshmi_avani_blowjob_end ===
Lakshmi pulls away slowly, a soft, wet sound following the motion. She wipes her mouth with the back of her hand, then the side of her thumb, more carefully this time, as if she’s trying to erase evidence that doesn’t want to leave. She looks up at you, cheeks flushed deep, breath coming in short, uneven gasps. A few strands of hair stick to her temple. “We—we should probably get back,” she says, but there’s no real urgency in her voice—only the lingering haze of what just happened. She stands on slightly unsteady legs, smoothing down her lab coat with shaky hands, fingers lingering a second too long at the buttons. “That was…” She trails off, searching for the right word, eyes flicking away and then back to yours. “Intense. More than I expected.”

* [Thank her. # insight: root]
    You tuck yourself back into your pants with deliberate care, then reach out to cup her face. Your thumb brushes the corner of her mouth, still slightly swollen. “Thank you,” you say softly. “That was… unexpected. In the best way.” She leans into your touch without thinking, eyes closing for a brief, private moment, as if she’s storing the feeling away. “Yeah,” she whispers. “It was.” When she opens her eyes again there’s something softer there, something she doesn’t quite know how to name yet. She takes a deep breath, squares her shoulders, and steps back, putting a careful distance between you. “We should go. Before someone notices we’re missing and starts asking questions neither of us wants to answer.” Her voice is steadier now, but the flush on her cheeks hasn’t faded. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 3)
    -> lakshmi_avani_topics
* [Tease her. # insight: graft]
    You smirk, adjusting your belt with exaggerated calm. “Not bad, Doctor,” you say, voice light, almost conversational. “I think I’ll keep you around. For scientific purposes, of course.” She rolls her eyes, but there’s a smile playing at the corners of her mouth that she can’t quite kill. “You’re insufferable,” she mutters, but she doesn’t sound upset—more like she’s trying not to laugh. “Come on. Let’s get back before someone comes looking and finds us looking like we just… did exactly what we just did.” She reaches for the door, then pauses, glancing back at you over her shoulder. “This doesn’t change anything, you know.” You raise an eyebrow. “Doesn’t it?” She hesitates, fingers resting on the handle, then shakes her head once. “No. It doesn’t.” But the way she says it—quiet, a little too firm—makes it clear she’s not entirely sure she believes it herself. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 4)
    -> lakshmi_avani_topics
* [Promise more later. # insight: static]
    You catch her hand before she can open the door, pulling her back against you. "This isn't over," you murmur against her ear. "Not by a long shot." She shivers, her body pressing into yours. "You're trouble," she says, but there's no real heat in it. "I know." You let her go, and she takes a deep breath, squaring her shoulders. "We should get back." She opens the door, stepping out into the hallway. You follow, the taste of her still on your lips. # speaker: npc:lakshmiAvani
    ~ adjust_affinity("lakshmiAvani", 5)
    -> lakshmi_avani_topics

=== lakshmi_avani_private_end ===
Lakshmi takes a deep breath, straightening up. "Thank you for this. It... means a lot." She opens the door a crack, checking the hallway. Before stepping out, she turns back to you one last time. "Be careful out there. I'd... hate to lose this." The words hang in the air between you, more vulnerable than anything she's said before. # speaker: npc:lakshmiAvani # portrait: vulnerable
-> lakshmi_avani_topics
