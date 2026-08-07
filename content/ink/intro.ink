// Case #1 cold-open — "Aveline Biogenetics, District 4" (docs/GAME_GUIDE.md).
// The player's real first scene: auto-loaded once Character Creation
// confirms, before the Overworld is ever shown. A three-beat squad-car
// montage (Cholon departure -> District 4 crossing -> lab arrival, each
// with its own backdrop) before the case itself opens. Deliberately no
// checks or wellbeing calls — an ordinary-looking case, per the Saigon
// Constabulary lore note that Compact-level danger signals arrive later,
// not upfront.

VAR ledger = 0
VAR root = 0
VAR static = 0
VAR hustle = 0

The squad car pulls out of Cholon's press of noodle-stall steam and shopfront signage, three scripts deep on every storefront, and noses south toward District 4. # background: cholonMarket # music: introTheme # ambience: +engineIdle # ambience: +marketChatter
{ root >= 3:
    Something in you eases and aches at once, watching it go — Cantonese call-and-response over a mahjong table, a grandmother arguing produce prices in Vietnamese two stalls down. Home, or close enough to it that the difference doesn't matter today. # speaker: insight:root
- else:
    Cholon slides by the same as it always does — dense, loud, none of your business today.
}

The dispatch slip is still glowing on the dash terminal, and it hasn't gotten any longer since you first read it. Detective needed. Aveline Biogenetics, District 4. That's the whole briefing.
{ hustle >= 3:
    That's not a briefing, that's a dare. Nobody hands you a name and an address and calls it done unless they want you walking in blind on purpose. # speaker: insight:hustle
- else:
    Thin, even for a Tuesday. You've worked cases with less to go on.
}

* [Keep driving.]
    The streets change before the skyline does. Platform-level towers give way to squat, water-stained concrete and storm shutters instead of storefront glass. Ahead, the District 4 flood wall rises out of the haze — thirty meters of reinforced grey holding the river exactly where the engineers decided it's allowed to be. # background: district4FloodWall # ambience: -marketChatter # ambience: +rain
    { static >= 3:
        You do the math without meaning to: how much water sits on the other side of that wall, and how many pump stations have to keep working, every hour, forever, for this block to stay dry. # speaker: insight:static
    - else:
        You've driven past a dozen walls like it. You stopped really looking at them years ago.
    }

    You didn't figure the Constabulary for this kind of call. Aveline runs its own security, same as every other name on the SEZAC roster — a badge-carrying detective showing up at all means somebody upstream wanted eyes that don't answer to Aveline's payroll.
    { ledger >= 3:
        The Ledger has an opinion: nobody hands a stranger a look inside the house unless keeping it in the family costs more than the exposure does. Aveline is scared of something bigger than a burglary. # speaker: insight:ledger
    - else:
        Whatever the reason, it's not a good one. You'll find out which kind once you're inside.
    }

    The car slows to a crawl for the last stretch, idling past a checkpoint barrier nobody's bothered to lower in weeks.
    -> arrival

== arrival ==
The lab itself is nothing to look at — a low prefab bolted to the inside of the flood wall, no logo on the door, two SEZAC cruisers already parked outside with their lights off. # background: avelineLabExterior # ambience: -engineIdle
Two uniforms are posted at the entrance, one leaning on a cruiser's hood, the other straightening up as your engine cuts out. Neither looks thrilled to be standing next to a flood wall on their shift. "Detective," the closer one says, and jerks a thumb at the door before you've even asked. "She's inside. Hasn't come out since we called it in."

* [Head in.]
    A woman in an Aveline lab coat is waiting just inside the door, arms crossed, badge already scanned and logged. Steam curls off a cup she's not drinking from. "You're the detective." Not a question. "Mei Hong. I run this lab. Or I did, until this morning." # speaker: npc:meiHong
    "Someone got in. Took something. That part's simple." She doesn't move from the doorway. "What they took isn't." # speaker: npc:meiHong
    "It's proprietary. Aveline property, licensed research — nothing that concerns the Constabulary under normal circumstances." Her voice doesn't change, but her eyes do. "I can tell you it's dangerous in the wrong hands. I can't tell you more than that. Not without an authorization I don't have yet." # speaker: npc:meiHong
    { ledger >= 3:
        The Ledger clocks it immediately: that's not company policy talking. That's a woman deciding, in real time, exactly how much truth she can afford to spend on you. # speaker: insight:ledger
    - else:
        Corporate runaround, dressed up as concern. You've heard a hundred versions of this line before.
    }
    -> stonewalled

== stonewalled ==
Whatever it was, it's gone, and the woman in front of you isn't going to be the one who tells you what. That's a start, same as any other case — a room, a witness, and a hole where the truth should be.

* [Get to work.]
    -> END
