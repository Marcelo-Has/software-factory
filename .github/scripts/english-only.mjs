#!/usr/bin/env node
// Gate: fails the build if non-English content is found in the factory core.
//
// Scope: CLAUDE.md, DECISIONS.md, .claude/, .github/, factory/ — everything this
// repo's own D-001 declares must be 100% English. Product content under project/
// and app/ is out of scope by design: NEVER scanned.
//
// The factory core is English-only (R-EN). Two detection layers:
//
//   Layer A (generic): any Unicode LETTER outside A-Za-z is flagged. Punctuation
//   like em-dashes and curly quotes is fine — only letters count. This one rule
//   catches Portuguese, Spanish, French, German, and anything else with accented
//   or non-Latin letters, without knowing the language in advance.
//
//   Layer B (origin-specific): a curated Portuguese stopword list, matched as
//   whole words, case-insensitive. This exists because Layer A is blind to
//   unaccented Portuguese words (para, como, deve, ainda...) that are also valid
//   English-adjacent letter sequences. Layer B targets Portuguese specifically
//   because that is the origin language this core was ported from — extend the
//   wordlist (or add a Layer C) if your fork's contributors drift into another
//   unaccented language.
//
// A cited proper name (e.g. quoted verbatim from the origin repo as a documented
// example) can be allowlisted in english-only-allowlist.json instead of being
// rewritten. The allowlist applies to both layers.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = process.cwd()

const TARGET_PATHS = ['CLAUDE.md', 'DECISIONS.md', '.claude', '.github', 'factory']

const TEXT_EXTENSIONS = new Set(['.md', '.mjs', '.js', '.ts', '.json', '.yml', '.yaml', '.txt'])

const EXCLUDE_DIRS = new Set(['node_modules', '.git'])

// This gate's own source (and its sibling gate) legitimately contain the
// words/characters they detect — never scan them as content.
const EXCLUDE_FILES = new Set([
  '.github/scripts/english-only.mjs',
  '.github/scripts/boundary-check.mjs',
  '.github/scripts/english-only-allowlist.json',
])

const ALLOWLIST_PATH = '.github/scripts/english-only-allowlist.json'

// Layer A: flag any character above the ASCII range (0-127) that Unicode
// classifies as a letter. Codepoint arithmetic, not a regex escape, so this
// stays simple to read and audit.
const IS_UNICODE_LETTER_RE = /\p{L}/u

function hasNonAsciiLetter(line) {
  for (const ch of line) {
    if (ch.codePointAt(0) > 127 && IS_UNICODE_LETTER_RE.test(ch)) return true
  }
  return false
}

// Layer B: curated Portuguese stopwords invisible to Layer A (no accents).
const PORTUGUESE_STOPWORDS = [
  'que',
  'nao',
  'funcao',
  'tambem',
  'deve',
  'para que',
  'exemplo',
  'entao',
  'porque',
  'para',
  'como',
  'ainda',
  'sempre',
  'depois',
  'entre',
]

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const PORTUGUESE_WORD_RE = new RegExp(`\\b(${PORTUGUESE_STOPWORDS.map(escapeRegExp).join('|')})\\b`, 'i')

function loadAllowlist() {
  try {
    const raw = readFileSync(join(ROOT, ALLOWLIST_PATH), 'utf8')
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
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
  const allowlist = loadAllowlist()
  const files = collectTargetFiles().filter((f) => TEXT_EXTENSIONS.has(extname(f)))
  const violations = []

  for (const file of files) {
    const rel = toRelPosix(file)
    if (EXCLUDE_FILES.has(rel)) continue

    const content = readFileSync(file, 'utf8')
    const lines = content.split('\n')

    lines.forEach((line, idx) => {
      const layerAHit = hasNonAsciiLetter(line)
      const layerBHit = PORTUGUESE_WORD_RE.test(line)
      if (!layerAHit && !layerBHit) return

      const isAllowed = allowlist.some((term) => line.includes(term))
      if (isAllowed) return

      const layer = layerAHit ? 'A (non-ASCII letter)' : 'B (Portuguese stopword)'
      violations.push({ file: rel, line: idx + 1, layer, text: line.trim() })
    })
  }

  if (violations.length > 0) {
    console.error(`english-only: ${violations.length} violation(s) found:\n`)
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  [layer ${v.layer}]  ${v.text}`)
    }
    console.error(`\nIf this is a cited proper name, add it to ${ALLOWLIST_PATH}.`)
    process.exit(1)
  }

  console.log(`english-only: OK (${files.length} files scanned)`)
}

main()
