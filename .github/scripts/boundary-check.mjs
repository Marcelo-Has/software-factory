#!/usr/bin/env node
// Gate: fails the build if the factory core references the origin product.
//
// Scope: factory/, .claude/, .github/ — the immutable core (see CLAUDE.md's golden
// rule and D-001). These directories must never depend on, or leak identity from,
// a specific product: not its code paths, not its name, not its hosting ids.
//
// "src/" and "worker/" are banned as bare, top-level-looking path references
// (the origin repo's own product-code layout) but NOT when nested under app/
// (e.g. "app/web/src/", "app/worker/"), which are legitimate paths in this repo.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = process.cwd()

const TARGET_PATHS = ['factory', '.claude', '.github']

const TEXT_EXTENSIONS = new Set(['.md', '.mjs', '.js', '.ts', '.json', '.yml', '.yaml', '.txt'])

const EXCLUDE_DIRS = new Set(['node_modules', '.git'])

const EXCLUDE_FILES = new Set([
  '.github/scripts/english-only.mjs',
  '.github/scripts/boundary-check.mjs',
])

// Product-identity literal strings/words from the origin repo (personal-gift-project).
// Its Firebase project id and Netlify site id are the product name itself — see
// netlify.toml in the origin repo — so banning the name covers those too.
const BANNED_WORDS = ['personal-gift-project', 'personal-gift', 'gift', 'nossa', 'historia']

const BANNED_WORD_RE = new RegExp(`\\b(${BANNED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i')

// Bare "src/" or "worker/" path tokens (the origin repo's own product-code
// layout), but not when the same token is nested under "app/" anywhere earlier
// in its path (e.g. "app/web/src/", "app/worker/"), which are legitimate paths
// in this repo. Checked per whitespace-delimited token, not per line, so a
// legitimate token doesn't get shadowed by an unrelated banned one on the line.
const PATH_TOKEN_RE = /[^\s"'`()<>]+/g
const HAS_BANNED_SEGMENT_RE = /(^|\/)(src|worker)\//i

function hasBannedPath(line) {
  const tokens = line.match(PATH_TOKEN_RE) || []
  return tokens.some((token) => HAS_BANNED_SEGMENT_RE.test(token) && !token.toLowerCase().includes('app/'))
}

function walk(dir, files) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else {
      files.push(full)
    }
  }
}

function collectTargetFiles() {
  const files = []
  for (const target of TARGET_PATHS) {
    const full = join(ROOT, target)
    let st
    try {
      st = statSync(full)
    } catch {
      continue // not created yet by this port session
    }
    if (st.isDirectory()) {
      walk(full, files)
    } else {
      files.push(full)
    }
  }
  return files
}

function toRelPosix(file) {
  return relative(ROOT, file).split('\\').join('/')
}

function main() {
  const files = collectTargetFiles().filter((f) => TEXT_EXTENSIONS.has(extname(f)))
  const violations = []

  for (const file of files) {
    const rel = toRelPosix(file)
    if (EXCLUDE_FILES.has(rel)) continue

    const content = readFileSync(file, 'utf8')
    const lines = content.split('\n')

    lines.forEach((line, idx) => {
      const hit = BANNED_WORD_RE.test(line) || hasBannedPath(line)
      if (!hit) return
      violations.push({ file: rel, line: idx + 1, text: line.trim() })
    })
  }

  if (violations.length > 0) {
    console.error(`boundary-check: ${violations.length} violation(s) found:\n`)
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  ${v.text}`)
    }
    console.error('\nThe factory core (factory/, .claude/, .github/) must never reference the origin product.')
    process.exit(1)
  }

  console.log(`boundary-check: OK (${files.length} files scanned)`)
}

main()
