// Dev-time only: compiles every content/ink/*.ink to its sibling .json via
// inkjs/full's Compiler. Never imported by shipped code — same authoring-time-only
// rule CLAUDE.md states for Compiler itself. Run with `npm run compile:ink`
// whenever a .ink source file changes (docs/CONTENT_PIPELINE_SPEC.md).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Compiler } from 'inkjs/full'

const inkDir = join(dirname(fileURLToPath(import.meta.url)), '../content/ink')

for (const file of readdirSync(inkDir)) {
  if (!file.endsWith('.ink')) continue
  const source = readFileSync(join(inkDir, file), 'utf-8')
  const json = new Compiler(source).Compile().ToJson()
  const outFile = file.replace(/\.ink$/, '.json')
  writeFileSync(join(inkDir, outFile), json)
  console.log(`compiled ${file} -> ${outFile}`)
}
