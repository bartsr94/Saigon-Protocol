EXTERNAL skillCheck(skillName, targetNumber)

VAR combatResult = ""

-> intro

=== intro ===
Rain hammers the elevated walkways of District 7 as you step out of the transit pod, neon light smearing across wet ferrocrete.

Your contact said Pier 14, no later than midnight. You're early.

* [Head straight to the pier]
    -> pier
* [Scope the area first]
    -> scope_area

=== scope_area ===
You linger under a noodle stall's awning, watching the pier from a distance. Drone traffic is light tonight. No obvious watchers.

-> pier

=== pier ===
Pier 14 is quiet except for the slap of water against the pilings. A figure in a rain-slicked coat waits near a shuttered cargo container.

{ skillCheck("streetwise", 8):
    -> recognize_contact
- else:
    -> tense_approach
}

=== recognize_contact ===
You clock the posture before the face — ex-corpo security, now freelance. This is your contact.

"You're late," they say. "Or early. Hard to tell with you."

-> END

=== tense_approach ===
You can't place them. Corpo enforcer? Rival fixer? You close the distance carefully, one hand near your jacket.

They watch you approach without moving. Then their hand drops to their hip. # combat: corpo-enforcer

-> await_combat

=== await_combat ===
{ combatResult == "win":
    -> combat_won
- else:
    -> combat_lost
}

=== combat_won ===
The enforcer drops. You catch your breath, pulse hammering, and check the pier. Still quiet.

-> END

=== combat_lost ===
Pain blooms white behind your eyes. The last thing you register is the wet ferrocrete rushing up to meet you.

-> END
