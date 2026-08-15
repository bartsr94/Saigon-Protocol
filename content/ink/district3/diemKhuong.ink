// Diễm Khương — runs Pasteur Street Taproom out of her own family's villa
// ground floor. Last of her line who didn't take the off-world offer when
// the rest of it did (see the vault's District 3 file, "Absentee Ground").
// INCLUDEd from content/ink/pasteurStreetTaproom.ink, which owns the shared
// EXTERNAL declarations and Insight VARs this file reads.

VAR affinity_diem_khuong = 0

=== diem_khuong_intro ===
She's pulling a tap when you walk in, sleeve pushed up past a forearm of cosmetic bio-luminescent grafting — decorative, deliberate, nothing about it built for labor. # speaker: npc:diemKhuong # background: pasteurStreetTaproom
"Badge or no badge, you're drinking or you're in the way." She doesn't look up from the glass. # speaker: npc:diemKhuong
"Diễm. I run this floor. Whatever you're here about, it's not going to be the interesting part of my night." # speaker: npc:diemKhuong
-> END

=== diem_khuong_topics ===
{ affinity_diem_khuong >= 5:
    Diễm slides a glass your way without being asked. "Detective. Sit, you're making the regulars nervous standing like that." # speaker: npc:diemKhuong
- else:
    Diễm keeps working the taps, half an eye on you. "Still here. Try not to clear the room." # speaker: npc:diemKhuong
}
* [Ask who actually owns this building. # insight: ledger]
    "On paper? A holding company with a mailing address on a platform I've never seen a shuttle actually land on." She shrugs, wiping a glass that's already clean. "Grandmother's sister took the offer three generations back. Kept the deed instead of selling, because why wouldn't you — free money sitting on ground nobody was using." # speaker: npc:diemKhuong
    ~ adjust_affinity("diemKhuong", 1)
    -> diem_khuong_topics
* [Ask why she stayed instead of following the rest of the family up. # insight: root]
    Her hands slow on the glass, just for a second. "Somebody had to. And I like it here more than I like the idea of a platform with better air and worse ground." A pause. "That's not the whole answer. It's the one I give people I've known for five minutes." # speaker: npc:diemKhuong # portrait: guarded
    ~ adjust_affinity("diemKhuong", 2)
    -> diem_khuong_topics
* [Ask about the graft work on her arm. # insight: graft]
    "This?" She turns it toward the light on purpose, lets it catch. "Purely cosmetic. No tolerance rating, no labor certification, does exactly nothing except look good under bad lighting." # speaker: npc:diemKhuong
    Graft clocks the difference instantly — nothing about the work reads like District 4's survival grafts, and she knows it exactly as well as you do. Down at the port, work like this gets asked what it's rated for. Up here, nobody asks anything but where she got it done. # speaker: insight:graft
    ~ adjust_affinity("diemKhuong", 1)
    -> diem_khuong_topics
* [Ask if the absentee landlords ever come collecting. # insight: hustle]
    "Once, maybe eight years back. A grandnephew of somebody, come to look at 'the family property' like he'd read about it in a file." She laughs, short and not entirely warm. "Stood in the doorway for ten minutes, took some pictures, left. Never heard from him again. I think we disappointed him." # speaker: npc:diemKhuong
    ~ adjust_affinity("diemKhuong", 1)
    -> diem_khuong_topics
