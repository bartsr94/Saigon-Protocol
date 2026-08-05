# Documentation Update Protocol

We have just completed a piece of work in this conversation. Your job is to
reflect what was built or changed in the relevant existing documentation.
Update only what changed — do not rewrite docs from scratch, and do not do a
general audit of unrelated content.

This file (`docs.md`) holds the full protocol. The related commands —
`/update`, `/update-file`, `/diff`, `/changelog`, `/summary`, `/commands` —
each run a specific slice of it; see `.claude/commands/commands.md` for the
menu. Running `/docs` on its own does step 1 only: scan and report, no edits.

## Step 1: Review the work

Look back over this conversation for what actually changed: code written,
decisions made, patterns established, systems designed, config changed, or
open questions resolved.

## Step 2: Identify affected docs

Use this project's actual doc set and the routing guide below — don't guess
at files that don't exist.

### File Routing Guide

| Change type | File to update |
|---|---|
| A system was designed, built, or its design changed (Combat, Character, Resolution Engine, Story/ink boundary, Save/Persistence, Navigation) | `SAIGON_PROTOCOL_ARCHITECTURE.md` — update the relevant numbered section, and log the decision in its "Key Architectural Decisions (running log)" section. |
| An open question in the architecture doc got resolved | Remove or resolve the entry under "Open question to resolve before detailing X" in `SAIGON_PROTOCOL_ARCHITECTURE.md`, and fold the resolution into the running log and the relevant section instead. |
| Setting, lore, factions, regions, or tone/theme content was authored or changed | `SEA_CYBERPUNK_GDD.md`. |
| Stack, setup steps, npm scripts, or the high-level project description changed | `README.md`. |
| A visual/UI design system or convention was established (e.g. shared component patterns, styling approach) | `SAIGON_PROTOCOL_ARCHITECTURE.md`, as a short addition near the relevant system — this repo has no separate UI style guide yet; don't create one unless asked. |

If work doesn't clearly map to any of the above (e.g. a pure content addition
to `src/content/`, or a one-off bugfix with no architectural implication),
say so and don't force an edit.

## Step 3: Propose changes

For each affected file, state:
- The section to update and why
- The new content to add
- Anything now outdated that should be removed or corrected

## Step 4: Wait for approval, then update one file at a time

Don't batch-edit. Apply one file, move to the next.

## Rules

- Only update what the completed work actually affects — no general audit
- Match the existing tone, voice, and formatting of each document
- Do not add sections that don't already exist unless explicitly asked
- Keep updates concise — reflect the change, don't over-document it
- If something was removed or deprecated, remove or strike it from the docs too
- Keep `SAIGON_PROTOCOL_ARCHITECTURE.md`'s running log append-only in spirit —
  don't rewrite past entries, add new ones
