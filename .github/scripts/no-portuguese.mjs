#!/usr/bin/env node
// Gate: fails the build if Portuguese content is found in the factory core.
//
// Scope: CLAUDE.md, DECISIONS.md, .claude/, .github/, factory/ — everything this
// repo's own D-001 declares must be 100% English. Product content under project/
// and app/ is out of scope by design.
//
// Detection: accented Portuguese characters (case-insensitive), plus a small
// curated word list for accent-less Portuguese function words. A cited proper
// name (e.g. quoted verbatim from the origin repo as a documented example) can be
// allowlisted in no-portuguese-allowlist.json instead of being rewritten.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = process.cwd()

const TARGET_PATHS = ['CLAUDE.md', 'DECISIONS.md', '.claude', '.github', 'factory']

const TEXT_EXTENSIONS = new Set(['.md', '.mjs', '.js', '.ts', '.json', '.yml', '.yaml', '.txt'])

const EXCLUDE_DIRS = new Set(['node_modules', '.git'])

// This gate's own source (and its sibling gate) legitimately contain the PT
// words/characters they detect — never scan them as content.
const EXCLUDE_FILES = new Set([
  '.github/scripts/no-portuguese.mjs',
  '.github/scripts/boundary-check.mjs',
  '.github/scripts/no-portuguese-allowlist.json',
])

const ALLOWLIST_PATH = '.github/scripts/no-portuguese-allowlist.json'

const ACCENTED_PT_CHARS_RE = /[ãõáéíóúâêôç]/i

const PT_WORDS = [
  'que',
  'nao',
  'não',
  'funcao',
  'função',
  'tambem',
  'também',
  'deve',
  'para que',
  'exemplo',
  'entao',
  'então',
  'porque',
  'voce',
  'você',
  'esta',
  'está',
]

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const PT_WORD_RE = new RegExp(`\\b(${PT_WORDS.map(escapeRegExp).join('|')})\\b`, 'i')

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
      const suspicious = ACCENTED_PT_CHARS_RE.test(line) || PT_WORD_RE.test(line)
      if (!suspicious) return

      const isAllowed = allowlist.some((term) => line.includes(term))
      if (isAllowed) return

      violations.push({ file: rel, line: idx + 1, text: line.trim() })
    })
  }

  if (violations.length > 0) {
    console.error(`no-portuguese: ${violations.length} violation(s) found:\n`)
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  ${v.text}`)
    }
    console.error(`\nIf this is a cited proper name, add it to ${ALLOWLIST_PATH}.`)
    process.exit(1)
  }

  console.log(`no-portuguese: OK (${files.length} files scanned)`)
}

main()
