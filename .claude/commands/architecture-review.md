---
description: Review code changes against this project's architecture rules and store boundaries
---

Review the current diff (or the work just completed in this conversation, if there's no diff to point at) against `SAIGON_PROTOCOL_ARCHITECTURE.md`. This is not a general code review — `/code-review` covers that. Focus only on architectural fit:

1. **Simulation/UI separation** — no dice math, stat calculation, or ink story-state mutation inside a React component or JSX. Components read from stores and dispatch actions only.
2. **Store boundaries** — changes stay within their owning store (`characterStore`, `storyStore`, `combatStore`, `navigationStore`, `saveStore`/`audioStore`). Flag cross-store reads/writes that should go through an action instead, or state that's crept into the wrong store.
3. **The ink ↔ TypeScript boundary** — ink handles prose/branching only; anything needing dice or character-state lookups must go through an `EXTERNAL` function into TypeScript (`src/ink/externalFunctions.ts`), never duplicated in ink's own variable system.
4. **Resolution Engine as single source of truth** — combat and narrative skill checks both resolve through `src/engine/resolution.ts`; flag any parallel/duplicate resolution logic.
5. **New systems or significant design changes** — check whether they've been logged in the architecture doc's "Key Architectural Decisions (running log)" section, and flag if not (don't add the entry yourself — that's `/update`'s job).

Report findings with the ReportFindings tool, most severe first. For each: which rule it breaks, the file/line, and the concrete consequence (e.g. "this couples combatStore to storyStore internals, breaking the hand-off contract described in §2"). If nothing violates the architecture, say so briefly — don't manufacture findings.
