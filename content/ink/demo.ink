// Story Engine wiring demo (see SAIGON_PROTOCOL_ARCHITECTURE.md §3).
// Not real game content — exercises the ink<->TS boundary: Insight-variable
// gating, a Red check via roll_check/is_red_check_consumed, a
// damage_composure EXTERNAL on the fail branch, and the content-tagging
// convention (docs/INK_CONTENT_TAGGING_SPEC.md) — an Insight interjection
// line, an NPC line, and a check choice carrying insight/check tags.

EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL damage_vitality(amount)
EXTERNAL heal_vitality(amount)
EXTERNAL damage_composure(amount)
EXTERNAL heal_composure(amount)

VAR ledger = 0
VAR graft = 0
VAR muscle_memory = 0
VAR root = 0
VAR static = 0
VAR hustle = 0
VAR mask = 0
VAR archetype = ""

Rain on corrugated steel. A checkpoint drone hovers at eye level, its lens hunting your face against a watchlist you're pretty sure you're on.
{ muscle_memory >= 3:
    Muscle Memory clocks the drone's blind spot before you've finished the thought. # speaker: insight:muscleMemory
- else:
    You don't know this model. You don't like that.
}

{ is_red_check_consumed("checkpoint-stare-down"):
    The drone's already made its decision about you. No talking your way past it twice.
    -> done
- else:
    * [Hold still and stare it down. # insight: muscleMemory # check: red]
        ~ temp result = roll_check("muscleMemory", 7, "checkpoint-stare-down", "red")
        { result:
            The drone hesitates, logs you as low-priority, and drifts off down the alley.
        - else:
            It doesn't blink. A second drone drops in behind you, and your pulse spikes hard enough to feel it in your teeth.
            ~ damage_composure(1)
        }
        -> done
}

== done ==
Mei Hong steps out of a noodle stall's steam, steam curling off her collar. "You made it past the checkpoint, detective. Rare, these days." # speaker: npc:meiHong
The moment passes, one way or another.
-> END
