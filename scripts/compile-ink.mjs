// Dev-time only: compiles every top-level content/ink/*.ink to its sibling
// .json via inkjs/full's Compiler. Never imported by shipped code — same
// authoring-time-only rule CLAUDE.md states for Compiler itself. Run with
// `npm run compile:ink` whenever a .ink source file changes
// (docs/CONTENT_PIPELINE_SPEC.md).
//
// Only compiles files directly under content/ink/ (non-recursive) — a
// subfolder like content/ink/aveline/ holds INCLUDE-only per-character
// files that aren't loaded standalone by locationStories.ts, so they don't
// get their own .json. A PosixFileHandler rooted at inkDir resolves those
// INCLUDE statements at compile time, folding included content into the
// one top-level file's compiled JSON.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Compiler, CompilerOptions } from 'inkjs/full'
import { PosixFileHandler } from 'inkjs/compiler/FileHandler/PosixFileHandler'

const inkDir = join(dirname(fileURLToPath(import.meta.url)), '../content/ink')
const fileHandler = new PosixFileHandler(inkDir)

for (const file of readdirSync(inkDir)) {
  if (!file.endsWith('.ink')) continue
  const source = readFileSync(join(inkDir, file), 'utf-8')
  const options = new CompilerOptions(file, [], false, null, fileHandler)
  const json = new Compiler(source, options).Compile().ToJson()
  const outFile = file.replace(/\.ink$/, '.json')
  writeFileSync(join(inkDir, outFile), json)
  console.log(`compiled ${file} -> ${outFile}`)
}
