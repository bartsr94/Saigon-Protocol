Print this command list, then stop — do not run any protocol step.

```
Project commands (.claude/commands/):
/refamiliarize — Re-orient on repo structure, git state, and recent activity
/docs          — Scan for docs affected by the work just completed (report
                  only, no edits)
/update        — Propose and apply updates to every affected doc, one file at
                  a time, after approval
/update-file   — Update one specific file only. Usage: /update-file README.md
/diff          — Show a before/after diff of proposed doc changes before
                  applying
/changelog     — Add an entry for the completed work (asks first — no
                  CHANGELOG.md exists in this repo yet)
/summary       — One-paragraph plain-English summary of what changed, for PR
                  descriptions or standup notes
/wrap-up       — Branch, commit all local changes, and push
/commands      — Print this list

General (built-in) commands, available in any project:
/init                — Initialize a new CLAUDE.md file with codebase docs
/review              — Review a GitHub pull request (for your working diff,
                        use /code-review)
/code-review         — Review pending changes on the current branch;
                        "ultra" runs a multi-agent cloud review
/security-review     — Security review of pending changes on current branch
/run                 — Launch/run the app to see a change working live
/simplify            — Review changed code for reuse, simplification, and
                        efficiency, then apply fixes (quality only, not bugs)
/loop [interval]      — Run a prompt or command repeatedly on an interval
/schedule            — Create/manage scheduled cloud agent routines (cron)
/update-config       — Configure the Claude Code harness: settings.json,
                        hooks, permissions, env vars
/keybindings-help    — Customize keyboard shortcuts / chord bindings
/fewer-permission-prompts — Scan transcripts and allowlist common safe
                        tool calls to cut permission prompts
/claude-in-chrome    — Automate Chrome to click, fill forms, and read pages

Contextual/reference skills (auto-load when relevant, no /command needed):
dataviz, artifact-design, artifact-diagramming, artifact-capabilities,
claude-api (Claude/Anthropic API reference)
```

Full doc-update protocol, rules, and the file routing guide live in
`.claude/commands/docs.md`.
