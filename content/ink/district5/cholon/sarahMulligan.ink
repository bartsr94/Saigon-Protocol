// Sarah Mulligan — an American exchange student on Erasmus, working the
// intake floor at the Y Duoc Cholon Medical Institute. INCLUDEd from
// content/ink/district5/yDuocInstitute.ink, which owns the shared EXTERNAL
// declarations and Insight VARs this file reads.

VAR affinity_sarah_mulligan = 0

=== sarah_mulligan_intro ===
She's leaning against the intake counter in a white coat two sizes too crisp for the room, flipping through a tablet like the whole ward already owes her an explanation. # speaker: npc:sarahMulligan # background: cholonClinic
"Oh, good, someone new." She doesn't look up right away. "Let me guess — CID. You people all have the same face on." # speaker: npc:sarahMulligan
"Sarah Mulligan. I'm the exchange student everyone forgets to introduce, so I introduce myself." # speaker: npc:sarahMulligan
-> END

=== sarah_mulligan_topics ===
{ affinity_sarah_mulligan >= 5:
    Sarah actually sets the tablet down when she sees you. "Detective. Come to save me from another shift of paperwork?" # speaker: npc:sarahMulligan
- else:
    Sarah barely glances up from the tablet. "Back again? Try not to slow down the real work." # speaker: npc:sarahMulligan
}
* [Why Cholon? # insight: hustle] "What's an Erasmus student doing all the way out here?"
    "Prestige, mostly." She shrugs like admitting it costs her nothing. "Half my program picked Geneva. I picked the place with an actual case volume — Cholon doesn't sanitize its data before it hands it to you." # speaker: npc:sarahMulligan
    ~ adjust_affinity("sarahMulligan", 1)
    -> sarah_mulligan_topics
* [The local staff # insight: mask] "What's your honest opinion of the local staff?"
    "Overworked, underpaid, and better than half my attendings back home, if you want the honest answer." She says it like a concession she resents making. "Don't tell them I said that." # speaker: npc:sarahMulligan
    -> sarah_mulligan_topics
* [Anything unusual? # check: white] "Have you noticed anything unusual on the intake floor?"
    ~ temp noticedResult = roll_check("root", 6, "y-duoc-sarah-noticed", "white")
    { noticedResult:
        Her tablet stops scrolling. "There's a referral pattern I flagged for my supervisor and got told to stop asking about. That's — not nothing." She's choosing her words like she already regrets how many she's given you. # speaker: npc:sarahMulligan # portrait: guarded
        ~ adjust_affinity("sarahMulligan", 2)
    - else:
        "Unusual is the entire premise of this hospital, Detective. Be specific, or I'm going back to my chart." # speaker: npc:sarahMulligan
    }
    -> sarah_mulligan_topics
* [Miss home? # insight: root] "Do you miss home?"
    "Missing it would require admitting it was better, and it wasn't." A pause, just long enough to notice. "Ask me again once I've had worse days here." # speaker: npc:sarahMulligan # portrait: guarded
    ~ adjust_affinity("sarahMulligan", 1)
    -> sarah_mulligan_topics
