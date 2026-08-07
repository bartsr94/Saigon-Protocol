// Dev-time only: batch-converts .wav sound effects/music into the .mp3 files
// public/audio/** actually serves. Requires ffmpeg on PATH (not vendored here
// since it's a large native binary — see the install instructions below).
//
// Usage:
//   node scripts/wav-to-mp3.mjs <file-or-directory> [options]
//
// Options:
//   --out <dir>       write .mp3s here instead of alongside the source .wav
//                      (directory structure is mirrored when input is a folder)
//   --bitrate <kbps>  MP3 bitrate, default 192
//   --delete-source   remove the source .wav after a successful conversion
//   --force           reconvert even if a newer .mp3 already exists
//
// Examples:
//   node scripts/wav-to-mp3.mjs ./raw-audio
//   node scripts/wav-to-mp3.mjs ./raw-audio/rain.wav --out public/audio/ambience
//   node scripts/wav-to-mp3.mjs ./raw-audio --out public/audio --delete-source

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'

function parseArgs(argv) {
  const args = { input: null, out: null, bitrate: 192, deleteSource: false, force: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--out') args.out = argv[++i]
    else if (arg === '--bitrate') args.bitrate = Number(argv[++i])
    else if (arg === '--delete-source') args.deleteSource = true
    else if (arg === '--force') args.force = true
    else if (!args.input) args.input = arg
    else throw new Error(`Unrecognized argument: ${arg}`)
  }
  if (!args.input) {
    throw new Error('Usage: node scripts/wav-to-mp3.mjs <file-or-directory> [--out <dir>] [--bitrate <kbps>] [--delete-source] [--force]')
  }
  return args
}

function checkFfmpeg() {
  const check = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  if (check.error) {
    console.error(
      [
        'ffmpeg was not found on PATH.',
        '',
        'Install it, then re-run this script:',
        '  Windows (winget): winget install --id Gyan.FFmpeg -e',
        '  Windows (choco):  choco install ffmpeg',
        '  macOS (brew):     brew install ffmpeg',
        '  Linux (apt):      sudo apt install ffmpeg',
      ].join('\n'),
    )
    process.exit(1)
  }
}

function findWavFiles(root) {
  const stat = statSync(root)
  if (stat.isFile()) {
    if (extname(root).toLowerCase() !== '.wav') {
      throw new Error(`Not a .wav file: ${root}`)
    }
    return [root]
  }

  const results = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (extname(entry.name).toLowerCase() === '.wav') results.push(full)
    }
  }
  walk(root)
  return results
}

function outputPathFor(wavPath, inputRoot, outDir) {
  const mp3Name = basename(wavPath, extname(wavPath)) + '.mp3'
  if (!outDir) return join(dirname(wavPath), mp3Name)

  const inputIsDir = statSync(inputRoot).isDirectory()
  if (!inputIsDir) return join(outDir, mp3Name)

  const relDir = relative(inputRoot, dirname(wavPath))
  return join(outDir, relDir, mp3Name)
}

function convert(wavPath, mp3Path, bitrate) {
  mkdirSync(dirname(mp3Path), { recursive: true })
  const result = spawnSync(
    'ffmpeg',
    ['-y', '-i', wavPath, '-codec:a', 'libmp3lame', '-b:a', `${bitrate}k`, '-hide_banner', '-loglevel', 'error', mp3Path],
    { stdio: 'inherit' },
  )
  return result.status === 0
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  checkFfmpeg()

  const inputRoot = resolve(args.input)
  if (!existsSync(inputRoot)) throw new Error(`Input not found: ${inputRoot}`)

  const outDir = args.out ? resolve(args.out) : null
  const wavFiles = findWavFiles(inputRoot)

  if (wavFiles.length === 0) {
    console.log('No .wav files found.')
    return
  }

  let converted = 0
  let skipped = 0
  let failed = 0

  for (const wavPath of wavFiles) {
    const mp3Path = outputPathFor(wavPath, inputRoot, outDir)

    if (!args.force && existsSync(mp3Path) && statSync(mp3Path).mtimeMs > statSync(wavPath).mtimeMs) {
      console.log(`skip (up to date): ${wavPath}`)
      skipped++
      continue
    }

    console.log(`converting: ${wavPath} -> ${mp3Path}`)
    if (!convert(wavPath, mp3Path, args.bitrate)) {
      console.error(`failed: ${wavPath}`)
      failed++
      continue
    }

    converted++
    if (args.deleteSource) unlinkSync(wavPath)
  }

  console.log(`\nDone. ${converted} converted, ${skipped} skipped, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main()
