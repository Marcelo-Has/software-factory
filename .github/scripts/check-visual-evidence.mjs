#!/usr/bin/env node
/**
 * The evidence gate of the Visual Verification Loop.
 *
 * The last of the factory's quality gates: **without screenshot evidence, the PR is rejected
 * outright, with no merit review.** Not "couldn't evaluate" — rejected. A critic that stays
 * silent when it has nothing to look at only exists when it isn't needed.
 *
 * Checks that EVERY file a complete round produces exists and isn't empty, at the path the
 * convention fixes: `artifacts/screenshots/<route>-<viewport>.png`. Incomplete evidence is
 * absence of evidence — a route that's missing is exactly the route nobody looked at.
 *
 * THE EXPECTED LIST COMES FROM THE SINGLE SOURCE, `ui-routes.mjs`, and isn't reimplemented
 * here: reimplementing the convention would only prove it can be written twice — and the day
 * the two copies diverge, the critic would reject a correct PR for not finding a file that
 * exists under a different name.
 *
 * WHY NOT `spawn` THE CAPTURER. Until the file listing was extracted, this list came from
 * running `screenshots.mjs --list`. That mode still exists and works — but `screenshots.mjs`
 * imports `playwright-core` at the top of the module, and the `design-critic` job does NOT
 * install dependencies (no `npm ci` in it: it downloads ready-made PNGs and calls an agent).
 * In CI, `--list` would exit 1 with `ERR_MODULE_NOT_FOUND`, this gate would fail closed, no
 * verdict would ever be written, and the job would sit red and MUTE — on every UI PR, without
 * exception. `design-critic` would be, in practice, a gate nobody could pass.
 *
 * `ui-routes.mjs` is importable without side effects (that's exactly why it was extracted)
 * and has no dependency; `screenshots.mjs`, which calls `process.exit` at the top, keeps
 * importing the SAME list from there — the single source doesn't get lost.
 *
 * Inputs, all by environment:
 *   DESTINATION      root the paths are relative to (default `.`).
 *   VERDICT_FILE     if set, the outright rejection is WRITTEN there when evidence is missing.
 *                     That's what makes the PR go red **with a published explanation** instead
 *                     of red and mute: `design-critic.yml`'s non-AI publish step runs with
 *                     `if: always()` and finds the file already there.
 *
 * Exit: 0 if the evidence is complete; 1 (with `::error::`) if any file is missing.
 */
import { statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles } from './ui-routes.mjs';

const DESTINATION = process.env.DESTINATION || '.';
const VERDICT = (process.env.VERDICT_FILE || '').trim();

/** The files a complete round has to produce, per the single source of routes. */
function expectedFiles() {
	return listFiles();
}

/** Missing = doesn't exist, isn't a file, or is 0 bytes. An empty PNG is a green with nothing in it. */
function missingFiles(expected) {
	return expected.filter((relative) => {
		try {
			const info = statSync(join(DESTINATION, relative));
			return !info.isFile() || info.size === 0;
		} catch {
			return true;
		}
	});
}

/** The verdict the non-AI step publishes on the PR when there was nothing to critique. */
function outrightRejection(missing, expected) {
	return [
		'## `design-critic` — REJECTED (visual evidence missing)',
		'',
		'This PR touches the interface and **did not produce the visual evidence** the Visual',
		'Verification Loop requires. No merit review happened: without the screenshots there is',
		'nothing to critique, and missing evidence rejects the PR **outright** — not "couldn\'t',
		'evaluate".',
		'',
		`${missing.length} of ${expected.length} files were missing under \`artifacts/screenshots/\`:`,
		'',
		...missing.map((a) => `- \`${a}\``),
		'',
		'**How to unblock:** check the `Screenshots` job for this PR. It depends on the deploy',
		'preview adapter (see `preview-url.mjs`); if the preview failed, the capture fails with it.',
		'A new UI route also needs a line in `ROUTES` in `.github/scripts/ui-routes.mjs` — a route',
		'without a capture is a route without evidence.',
		'',
		'To reproduce locally:',
		'',
		'```bash',
		'npm run build && npm run preview',
		'PREVIEW_URL=http://localhost:4173 node .github/scripts/screenshots.mjs',
		'node .github/scripts/check-visual-evidence.mjs',
		'```',
		''
	].join('\n');
}

function main() {
	let expected;
	try {
		expected = expectedFiles();
	} catch (error) {
		console.log(`::error::Could not determine which screenshots to expect: ${error.message}`);
		return 1;
	}

	if (expected.length === 0) {
		console.log(
			'::error::The capturer listed no files. The path convention is a contract of ' +
				'`design-critic` — an empty list would leave the evidence gate always green.'
		);
		return 1;
	}

	const missing = missingFiles(expected);
	if (missing.length === 0) {
		console.log(`Visual evidence complete: ${expected.length} screenshot(s) in \`${DESTINATION}\`.`);
		return 0;
	}

	if (VERDICT !== '') {
		writeFileSync(VERDICT, outrightRejection(missing, expected));
		console.log(`Outright rejection written to ${VERDICT} for the publish step.`);
	}
	console.log(
		`::error::Visual evidence incomplete: ${missing.length} of ${expected.length} ` +
			`screenshot(s) missing (${missing.join(', ')}). \`design-critic\` rejects the PR ` +
			'outright — incomplete evidence is absence of evidence.'
	);
	return 1;
}

process.exit(main());
