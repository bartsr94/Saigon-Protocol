// Dev-time only: compiles every content/ink/**.ink location story to its
// sibling .json via inkjs/full's Compiler. Never imported by shipped code —
// same authoring-time-only rule CLAUDE.md states for Compiler itself. Run
// with `npm run compile:ink` whenever a .ink source file changes
// (docs/SAIGON_PROTOCOL_ARCHITECTURE.md §11).
//
// content/ink/ is organized one level deep by district
// (content/ink/district4/checkpoint.ink, etc.), with intro.ink alone at the
// root (no district). Within a given directory, only the .ink files
// directly inside it are compiled (non-recursive) — a subfolder like
// content/ink/district4/aveline/ holds INCLUDE-only per-character files
// that aren't loaded standalone by locationStories.ts, so they don't get
// their own .json. A PosixFileHandler rooted at that same directory
// resolves those INCLUDE statements at compile time, folding included
// content into the one location file's compiled JSON.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Compiler, CompilerOptions } from 'inkjs/full'
import { PosixFileHandler } from 'inkjs/compiler/FileHandler/PosixFileHandler'

const inkDir = join(dirname(fileURLToPath(import.meta.url)), '../content/ink')

function compileDir(dir) {
  const fileHandler = new PosixFileHandler(dir)
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.ink')) continue
    const source = readFileSync(join(dir, entry.name), 'utf-8')
    const options = new CompilerOptions(entry.name, [], false, null, fileHandler)
    const json = new Compiler(source, options).Compile().ToJson()
    const outFile = entry.name.replace(/\.ink$/, '.json')
    writeFileSync(join(dir, outFile), json)
    console.log(`compiled ${join(dir, entry.name)} -> ${outFile}`)
  }
}

compileDir(inkDir)
for (const entry of readdirSync(inkDir, { withFileTypes: true })) {
  if (entry.isDirectory()) compileDir(join(inkDir, entry.name))
}
