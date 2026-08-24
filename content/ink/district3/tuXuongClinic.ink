// Tú Xương Clinic (src/content/locations.ts, LocationId 'tuXuongClinic') —
// District 3's back-alley graft clinic, per the vault's District 3 file's
// "Underside of the Canopy" section: a villa basement doing the body-mod
// work Aveline won't put its name on, for people the licensed price and
// paperwork both shut out. Optional city-life location (same status as
// pasteurStreetTaproom.ink), not Case 1 content. Two POIs: the waiver wall
// below, and Yến Lộc (talk).

EXTERNAL adjust_affinity(npcId, amount)

VAR ledger = 0
VAR graft = 0
VAR root = 0
VAR static = 0
VAR hustle = 0
VAR affinity_yen_loc = 0

=== tu_xuong_waiver_wall ===
A pinboard by the door holds nothing but paper — real paper, sun-yellowed at the edges, the kind no licensed clinic anywhere else in the SEZ still bothers printing. Each sheet is a waiver, a shaky signature at the bottom, a box next to "I understand the risk" ticked in a dozen different pens. # background: tuXuongClinic
{ ledger >= 3:
    The Ledger doesn't read waivers, it reads the tally scrawled in the margin of half of them — a running balance in installments, favors, and whatever a person had on them that week. Nobody here pays a flat rate for anything. # speaker: insight:ledger
- else:
    Someone's added running totals in the margins of a few sheets. You don't follow the arithmetic.
}
{ graft >= 3:
    Graft clocks the equipment through the open back-room doorway before it clocks anything else — salvaged Aveline-spec tooling, out of warranty by years, kept alive with parts that were never meant to go together. It'll do the job. It won't do the job the way a licensed table would. # speaker: insight:graft
- else:
    Through the back doorway, some kind of medical rig, patched together out of parts that don't quite match.
}
{ root >= 3:
    Root reads past the waivers to the handwriting itself — the same few names recurring across different sheets, different dates, people who keep coming back because there's nowhere else that'll take them at all. This isn't a clinic serving strangers. It's serving a community that ran out of other options a while ago. # speaker: insight:root
- else:
    A few of the names on these sheets repeat. You don't think much of it.
}
{ static >= 3:
    Static's already counted the exits before it read a single waiver — one door in, no window, a breaker box that's been rewired at least twice. Whatever happens on that table happens with no way to call it in from outside. # speaker: insight:static
- else:
    One door, one back room. Not much of a floor plan to speak of.
}

* [Read what's pinned up and step back.]
    -> tu_xuong_waiver_wall_done

== tu_xuong_waiver_wall_done ==
-> END

=== yen_loc_intro ===
She doesn't look up from the loupe clamped over one eye, a soldering iron held steady an inch above someone's open forearm on the table in front of her. "Sit if you're bleeding. Stand anywhere else if you're not." # speaker: npc:yenLoc # background: tuXuongClinic
A beat later the iron lifts, the loupe flips up, and she actually looks at you — badge or no badge, sizing up exactly how much of a problem you're about to be. "Yến. I do the work Aveline's too expensive to do and SEZAC's too slow to catch. Whatever you're here for, make it quick — I've got someone under a local waiting on this arm." # speaker: npc:yenLoc
-> END

=== yen_loc_topics ===
{ affinity_yen_loc >= 5:
    Yến doesn't reach for the loupe this time. "Detective. Sit down before you make me nervous standing there like that." # speaker: npc:yenLoc
- else:
    Yến keeps her eyes on the tray of tools between her and the table. "Still here. I'm listening, I'm just not stopping." # speaker: npc:yenLoc
}
* [Ask why she does this instead of getting properly certified. # insight: ledger]
    "Certified costs a licensing fee I'd need three good years to save for, on top of an Aveline apprenticeship that doesn't take anyone without a sponsor. I did the math a long time ago. This math works faster." # speaker: npc:yenLoc
    ~ adjust_affinity("yenLoc", 1)
    -> yen_loc_topics
* [Ask about the risk to whoever's on that table. # insight: graft]
    "Real. I tell every one of them exactly how real, which is more than the price tag usually gets you anywhere else." She nods at the pinboard through the doorway. "Every signature out there is somebody who heard the risk and decided their reasons were bigger than it. I don't get to decide that part for them." # speaker: npc:yenLoc # portrait: guarded
    ~ adjust_affinity("yenLoc", 2)
    -> yen_loc_topics
* [Ask what happened to her actual license. # insight: root]
    Her hands go still on the tool tray, just for a second. "Worked triage in a Xóm Chàm clinic during a bad flood season. Treated more people than the ration allowed supplies for, used what I had, kept people alive who weren't on anybody's approved list. Aveline called it a compliance violation. I call it Tuesday." A pause. "That's the short version. The long one doesn't end any better for anybody who still has a license to lose telling it." # speaker: npc:yenLoc
    ~ adjust_affinity("yenLoc", 2)
    -> yen_loc_topics
* [Ask if SEZAC or Aveline ever comes looking for this place. # insight: hustle]
    "Not yet. This district doesn't rate a patrol budget, and the parts I run don't come through any manifest anyone official reads." A short, humorless laugh. "Ask me again after word gets out I'm talking to a detective." # speaker: npc:yenLoc
    ~ adjust_affinity("yenLoc", 1)
    -> yen_loc_topics
* [Ask where the parts actually come from. # insight: static]
    "Same place everything in this district that isn't nailed down comes from eventually — a broker who doesn't put his name on the invoice, because there isn't one." She doesn't elaborate further, and doesn't need to. # speaker: npc:yenLoc
    ~ adjust_affinity("yenLoc", 1)
    -> yen_loc_topics
+ [Let her get back to the arm on her table.]
    She's already dropped the loupe back over her eye, iron steady, like the conversation ended before you finished leaving. # speaker: npc:yenLoc
    -> END
