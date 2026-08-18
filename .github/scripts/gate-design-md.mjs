// No shebang: this module is now IMPORTED (its `validate` export is reused by
// gate-contracts.mjs and gate-definition-done.mjs, and by their tests), and vitest's
// transformer rejects a leading `#!` line. Always invoked as `node .github/scripts/
// gate-design-md.mjs`, never as `./gate-design-md.mjs` directly.
/**
 * Deterministic (NON-AI) gate — "the design contract exists and is approved".
 *
 * **No UI code before `project/design/DESIGN.md` exists** — a non-AI gate in CI. This is
 * that gate. It rejects a PR that touches UI paths when the design contract is missing,
 * still a placeholder (`[TO FILL IN]`), or has a `Status` other than `approved` — which is
 * exactly the state the Foundation leaves it in (`candidate`) and from which no UI may be
 * derived.
 *
 * WHY NON-AI, AND WHY IN `ci.yml`: same design as the exit-contract and non-AI-publication
 * guard-rails — either the artifact exists and is valid, or the job fails. No agent judgment
 * enters here; the cost is zero tokens and a few seconds of runner time. `design-critic`
 * (which is AI) judges the *taste* of the UI afterward; this gate only proves a contract
 * exists to derive it from.
 *
 * FAIL-CLOSED on every doubt. If the changed-files list can't be obtained — PR base
 * unavailable, `git` failing, a push with nothing to compare against — the gate does NOT stay
 * quiet: it falls back to checking `DESIGN.md` unconditionally. A gate that stands down when
 * it doesn't know is a gate that only exists when it isn't needed.
 *
 * Inputs, all by environment (this is what makes every branch exercisable by a test):
 *   FILES     list of changed files, one per line. Wins over git.
 *   BASE_SHA  the PR's base commit. Without `FILES`, the gate runs
 *             `git diff --name-only BASE_SHA...HEAD`.
 *   neither -> unconditional mode.
 * `DESIGN.md` is looked up at `project/design/DESIGN.md`, relative to `process.cwd()`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * What counts as "touches UI". `project/design/DESIGN.md` itself is included because editing
 * the contract has to pass through the gate too.
 */
const UI_PATTERNS = [
	/^app\/web\/.*\.svelte$/, //     app/web/**/*.svelte — routes and components
	/\.(css|scss|postcss)$/, //      any stylesheet, including a global app.css
	/^app\/web\/src\/app\.html$/, // the document shell
	/^project\/design\/DESIGN\.md$/ // touching the contract itself has to pass the gate
];

/**
 * Build output and exported material. These are excluded because compiled build directories
 * are full of generated `.css`: without this pruning, any PR that rebuilds the app would
 * match the style pattern and the gate would lose track of what was actually edited.
 */
const IGNORED = [
	/^node_modules\//,
	/^\.svelte-kit\//,
	/^build\//,
	/^dist\//,
	/^\.netlify\//,
	/^test-results\//,
	/^playwright-report\//,
	/^artifacts\//
];

/** `true` if the path is interface code per the patterns above. */
function touchesUI(path) {
	const p = path.replace(/\\/g, '/').trim();
	if (p === '') return false;
	if (IGNORED.some((re) => re.test(p))) return false;
	return UI_PATTERNS.some((re) => re.test(p));
}

/**
 * The list of changed files, or `null` when it can't be known — and `null` does NOT mean
 * "nothing changed": it means "check anyway" (see the fail-closed note in the header).
 */
function changedFiles() {
	const explicit = process.env.FILES;
	if (explicit !== undefined && explicit.trim() !== '') {
		return explicit.split('\n').filter((l) => l.trim() !== '');
	}
	const base = (process.env.BASE_SHA || '').trim();
	if (base === '') return null;
	try {
		const output = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
			encoding: 'utf8'
		});
		return output.split('\n').filter((l) => l.trim() !== '');
	} catch (error) {
		console.log(`::warning::Could not diff against ${base} (${error.message.trim()}).`);
		return null;
	}
}

/**
 * Validates `DESIGN.md`'s content. Returns `{ ok: true }` or `{ ok: false, reason }`.
 *
 * The two invalid states aren't hypothetical: the DESIGN template is born with
 * `| **Status** | \`[TO FILL IN]\` — \`candidate\` \| \`approved\` |`, so an unedited copy of
 * the template trips both at once.
 */
export function validate(content) {
	const lines = content.split('\n');
	const placeholders = lines
		.map((line, i) => (line.includes('[TO FILL IN]') ? i + 1 : 0))
		.filter((n) => n > 0);
	if (placeholders.length > 0) {
		return {
			ok: false,
			reason: `still has \`[TO FILL IN]\` (line(s) ${placeholders.join(', ')}) — it's the template, not a filled-in contract.`
		};
	}
	const field = content.match(/^\|\s*\*\*Status\*\*\s*\|\s*`?([^|`]+?)`?\s*\|/m);
	if (field === null) {
		return {
			ok: false,
			reason: 'has no `Status` field in the header table — the contract\'s header was deleted or renamed.'
		};
	}
	const status = field[1].trim().toLowerCase();
	if (status !== 'approved') {
		return {
			ok: false,
			reason: `is at \`Status: ${status}\`. Only \`approved\` authorizes deriving UI: the Foundation PROPOSES, the owner approves identity, at a Decision Gate.`
		};
	}
	return { ok: true };
}

function main() {
	const path = join(process.cwd(), 'project', 'design', 'DESIGN.md');
	const changed = changedFiles();

	if (changed !== null) {
		const ui = changed.filter(touchesUI);
		if (ui.length === 0) {
			console.log(
				`None of the ${changed.length} changed file(s) touch UI paths — gate doesn't apply.`
			);
			return 0;
		}
		console.log(`UI files in this PR:\n  ${ui.join('\n  ')}`);
	} else {
		console.log('No changed-files list — checking `project/design/DESIGN.md` unconditionally.');
	}

	let content;
	try {
		content = readFileSync(path, 'utf8');
	} catch {
		console.log(
			'::error::This PR touches interface code and `project/design/DESIGN.md` does not exist. ' +
				'UI code before `DESIGN.md` exists is a violation of the design gate. Run the design ' +
				'Foundation (`/design-foundation`) and take the result to the "Visual identity and ' +
				'narrative" Decision Gate (`factory/docs/AUTONOMY.md`) before writing markup or CSS.'
		);
		return 1;
	}

	const verdict = validate(content);
	if (!verdict.ok) {
		console.log(
			`::error::This PR touches interface code and \`project/design/DESIGN.md\` ${verdict.reason}`
		);
		return 1;
	}

	console.log('`project/design/DESIGN.md` exists and is `approved` — there is a contract to derive the UI from.');
	return 0;
}

// Importable without side effects (the ui-routes.mjs / lint-antipatterns.mjs lesson): only
// run as a CLI when this file is the actual entry point, never when another script or a
// test imports `validate` from it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	process.exit(main());
}
