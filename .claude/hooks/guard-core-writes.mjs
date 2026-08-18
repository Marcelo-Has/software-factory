/**
 * PreToolUse hook: keeps the factory core immutable during a PRODUCT session, without the
 * static permission deny that also blocked the factory's OWN evolution sessions.
 *
 * BACKGROUND (D-008 / GR-10, see DECISIONS.md and factory/docs/FACTORY.md). A static
 * `deny: ["Edit(factory/**)", "Write(factory/**)"]` in `.claude/settings.json` can't tell
 * "a product session touching the core" from "a factory-evolution session touching the
 * core on purpose" — both look identical to a permission glob. That forced a manual
 * remove-deny -> work -> restore-deny protocol on every factory-evolution session (this one
 * included). This hook replaces the static deny with a MARKER-GATED check: the core is only
 * guarded when the repo is actually in PRODUCT MODE, detected deterministically from the
 * filesystem (see `isProductMode` below) rather than from any settings toggle. One identical
 * `settings.json` therefore ships unmodified in the factory-source repo (product mode never
 * arms, `project/` stays empty on `main`) and in every product repo (product mode arms itself
 * the moment `/init` runs and writes `project/state/init.json`).
 *
 * TWO MATCHERS, ONE SCRIPT. Registered in `.claude/settings.json` under both the
 * `Edit|Write|MultiEdit|NotebookEdit` matcher (PRIMARY guard — structural, keyed on
 * `tool_input.file_path`/`tool_input.notebook_path`) and the `Bash` matcher (DEFENSE IN
 * DEPTH ONLY — a best-effort text scan of the command string for an obvious write op next to
 * an obvious core-path mention; it can both over- and under-block, and that's an accepted
 * trade-off for a secondary check, not the primary one).
 *
 * FAIL-OPEN ON A MALFORMED PAYLOAD, BY DESIGN. GR-10 is narrow and opt-in: it only restricts
 * writes to four specific locations, and only in product mode. A parse bug that failed
 * CLOSED wouldn't just fail to enforce that narrow rule — it would block every
 * Edit/Write/MultiEdit/NotebookEdit call in the session, everywhere, including in the
 * factory-source repo where none of this should ever apply. That blast radius is
 * disproportionate to one script's bug, and it matches this repo's two existing Bash hooks
 * (`grep -q ... || exit 0`), which are already fail-open by construction. Every fail-open
 * path below still writes a one-line diagnostic to stderr first, so a broken payload shows up
 * in the transcript instead of vanishing silently.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Repo-relative path prefixes (forward-slash, matched case-insensitively) exempted from the
 * core-write block even in product mode. Empty today — add an entry only for a deliberate,
 * reviewed exception; every entry here is a hole in GR-10, so keep the list short and justify
 * each addition with a comment at the point it's added. Checked with the same prefix-match
 * logic as the core paths themselves (see `matchesPrefix`).
 */
export const ALLOWLIST = [];

const CORE_PREFIXES = ['factory/', '.claude/', '.github/'];
const CORE_ROOT_FILES = new Set(['claude.md', 'decisions.md']);

// A .gitkeep/README.md never counts as product content, no matter how deep it's nested —
// simplest, most auditable rule: one basename-membership check, no path-shape special-casing.
const EXEMPT_BASENAMES = new Set(['README.md', '.gitkeep']);

// Best-effort Bash heuristic (see header). Two independent conditions, both required, not
// required to be adjacent in the command string.
const WRITE_OP_RE = /(>{1,2})|\b(tee|cp|mv|rm)\b|sed\s+-i\b/;
const CORE_MENTION_RE = /factory\/|\.claude\/|\.github\/|\bCLAUDE\.md\b|\bDECISIONS\.md\b/i;

/** Repo-relative, forward-slash, lowercased key for classification only — never used for I/O. */
export function toRepoRelativeKey(root, filePath) {
	const abs = path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
	const rel = path.relative(root, abs);
	return rel.split(path.sep).join('/').toLowerCase();
}

function matchesPrefix(rel, prefix) {
	const norm = prefix.toLowerCase();
	const withSlash = norm.endsWith('/') ? norm : `${norm}/`;
	return rel === withSlash.slice(0, -1) || rel.startsWith(withSlash);
}

/** True if `filePath` (absolute or relative to `root`) is under the factory core. */
export function isCorePath(root, filePath, allowlist = ALLOWLIST) {
	const rel = toRepoRelativeKey(root, filePath);
	if (rel.startsWith('..')) return false; // resolves outside root entirely — not core
	if (allowlist.some((p) => matchesPrefix(rel, p))) return false;
	if (CORE_ROOT_FILES.has(rel)) return true;
	return CORE_PREFIXES.some((p) => matchesPrefix(rel, p));
}

function projectHasNonExemptFile(projectDir) {
	const stack = [projectDir];
	while (stack.length > 0) {
		const dir = stack.pop();
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			continue; // vanished mid-walk, or never existed — treat as empty
		}
		for (const entry of entries) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				stack.push(full);
			} else if (entry.isFile() && !EXEMPT_BASENAMES.has(entry.name)) {
				return true;
			}
			// Symlinks are deliberately not followed here — avoids walking outside
			// project/ via a link; a symlink itself doesn't count as "a file" for this
			// check.
		}
	}
	return false;
}

/**
 * PRODUCT MODE, decided deterministically from the filesystem: `project/state/init.json`
 * exists, OR `project/` holds any file (anywhere, recursively) besides `README.md`/
 * `.gitkeep`. The second condition closes the "delete the marker" bypass — to reopen the
 * core you'd have to delete the whole product, and the CI gates and PR review still exist
 * outside this hook regardless.
 */
export function isProductMode(root) {
	const initJson = path.join(root, 'project', 'state', 'init.json');
	if (existsSync(initJson)) return true;
	const projectDir = path.join(root, 'project');
	if (!existsSync(projectDir)) return false;
	return projectHasNonExemptFile(projectDir);
}

/** Best-effort Bash-command heuristic — see header for why this is defense-in-depth only. */
export function bashLooksLikeCoreWrite(command) {
	if (typeof command !== 'string' || command.length === 0) return false;
	return WRITE_OP_RE.test(command) && CORE_MENTION_RE.test(command);
}

function allowWithDiagnostic(reason) {
	process.stderr.write(
		`guard-core-writes: ${reason} — allowing (fail-open; GR-10 is opt-in and narrow-scope, see header).\n`
	);
	process.exit(0);
}

function blockEdit(relPath) {
	process.stderr.write(
		`Blocked: "${relPath}" is under the factory core (factory/, .claude/, .github/, CLAUDE.md,\n` +
			'DECISIONS.md). Per the golden rule in CLAUDE.md, those directories/files are the immutable\n' +
			'core; only project/ and app/ are writable during a product session. See\n' +
			'factory/docs/FACTORY.md (GR-10) if this write is intentional core evolution — that requires\n' +
			'a dedicated factory-evolution session, not a product session.\n'
	);
	process.exit(2);
}

function blockBash(command) {
	process.stderr.write(
		`Blocked: this command looks like it writes to the factory core: ${command}\n` +
			'Per the golden rule in CLAUDE.md, factory/, .claude/, and .github/ are the immutable core\n' +
			'during a product session. See factory/docs/FACTORY.md (GR-10). This is a best-effort,\n' +
			'defense-in-depth check — the Edit/Write/MultiEdit/NotebookEdit matcher is the primary guard.\n'
	);
	process.exit(2);
}

function main() {
	let raw;
	try {
		raw = readFileSync(0, 'utf8');
	} catch (err) {
		allowWithDiagnostic(`could not read stdin (${err.message})`);
		return;
	}

	let payload;
	try {
		payload = JSON.parse(raw);
	} catch (err) {
		allowWithDiagnostic(`could not parse PreToolUse payload as JSON (${err.message})`);
		return;
	}

	const root = typeof payload.cwd === 'string' && payload.cwd.length > 0 ? payload.cwd : null;
	if (!root) {
		allowWithDiagnostic('payload missing cwd, cannot determine product-mode root');
		return;
	}

	if (!isProductMode(root)) {
		process.exit(0);
		return;
	}

	const toolName = payload.tool_name;
	const input = payload.tool_input || {};

	if (toolName === 'Edit' || toolName === 'Write' || toolName === 'MultiEdit' || toolName === 'NotebookEdit') {
		// NotebookEdit uses tool_input.notebook_path, not file_path — the other three use
		// file_path.
		const isNotebook = toolName === 'NotebookEdit';
		const filePath = isNotebook ? input.notebook_path : input.file_path;
		if (typeof filePath !== 'string' || filePath.length === 0) {
			allowWithDiagnostic(
				`${toolName} payload missing tool_input.${isNotebook ? 'notebook_path' : 'file_path'}`
			);
			return;
		}
		if (isCorePath(root, filePath)) {
			blockEdit(toRepoRelativeKey(root, filePath));
			return;
		}
		process.exit(0);
		return;
	}

	if (toolName === 'Bash') {
		const command = input.command;
		if (bashLooksLikeCoreWrite(command)) {
			blockBash(command);
			return;
		}
		process.exit(0);
		return;
	}

	process.exit(0);
}

// `import.meta.main` doesn't exist in this Node target: the guard compares the module against
// argv[1] via pathToFileURL, so importing the exported functions (from a test) never runs
// main().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
