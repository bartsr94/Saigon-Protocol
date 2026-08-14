// Mei Hong — Aveline District 4 Laboratory operations lead. INCLUDEd from
// content/ink/checkpoint.ink, which owns the shared EXTERNAL declarations
// and the hustle/static/graft/ledger insight VARs this file reads.

// Mei Hong's repeat-visit topic loop (UI_PASS_SPEC.md §4) — a separate
// entry point from checkpoint.ink's top-of-file flow, only ever reached via
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

// End of Mei Hong's content. Lakshmi Avani's intro/topics/private scene
// live in content/ink/aveline/lakshmiAvani.ink.
