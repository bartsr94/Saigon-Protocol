Print this command list, then stop — do not run any protocol step.

```
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
```

Full doc-update protocol, rules, and the file routing guide live in
`.claude/commands/docs.md`.
