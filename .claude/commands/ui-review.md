---
description: Review UI/component changes against this project's cyberpunk UI system
---

Review the current diff (or the UI work just completed in this conversation) for consistency with the established visual system in `src/components/ui/` — `Button.tsx`, `CardButton.tsx`, `DiceRoll.tsx`, `GameFrame.tsx`, `Screen.tsx`, `StatBar.tsx`, and `uiChrome.css`.

Check for:

1. **Reuse over reinvention** — new screens/components should compose the existing primitives (`Button`, `CardButton`, `StatBar`, `GameFrame`, `Screen`) rather than hand-rolling equivalents with raw `div`/Tailwind classes.
2. **Visual consistency** — cyberpunk chrome (borders, glow, color palette, animation style like the dice-roll/crit-tier effects) matches what's already shipped, not a one-off style.
3. **Tailwind + `uiChrome.css` boundary** — utility classes for layout/spacing, but shared chrome/theme effects belong in `uiChrome.css`, not duplicated inline per component.
4. **Responsiveness** — screens work across the viewport sizes this game actually targets; no fixed-pixel layouts that break on resize.
5. **State plumbing** — components read UI-relevant state from the correct store (see `SAIGON_PROTOCOL_ARCHITECTURE.md` §3) and don't hold simulation state locally that belongs in Zustand.
6. **Audio/feedback hooks** — interactive elements that should trigger sound (per `audioStore`) actually do, consistent with existing buttons/cards.

If you can run the app (see the `run` skill), click through the affected screens before reporting rather than relying on static review alone. Report findings with the ReportFindings tool, most severe first — inconsistency with established patterns counts as a finding even if the new code "works."
