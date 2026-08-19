#!/usr/bin/env node
/**
 * Deterministic gate: LIGHTHOUSE ACCESSIBILITY SCORE >= 0.9 per route.
 *
 * The axe scan (a profile's own e2e suite) rejects `critical`/`serious` violations with a
 * ratchet. This script measures the SAME pages by a different ruler — the Lighthouse
 * accessibility score — and requires 0.9 on every route. It isn't redundant: the score is
 * weighted and includes audits our severity cut deliberately drops (`moderate`/`minor`), so
 * it catches the slow degradation that never reaches `serious`. Either check alone leaves a
 * hole: axe misses the sum, Lighthouse misses the grave isolated violation that barely moves
 * the score.
 *
 * WHY `npx` AND NOT A `devDependency`. `lighthouse` pulls a large tree, and the
 * `npm audit --audit-level=high` gate in `security.yml` doesn't forgive: one high
 * vulnerability anywhere in that tree would leave the scan permanently red over a DEV tool.
 * Same reasoning as pinning any other dev-only CLI: run it via `npx` with a fixed version,
 * outside `package.json`.
 *
 * The browser is Playwright's Chromium, via `CHROME_PATH`: installing a second Chrome on the
 * runner to measure the same page would mean paying twice for the same download.
 *
 * Inputs, all by environment:
 *   PREVIEW_URL   base to measure (e.g. `http://localhost:4173`). Required.
 *   FLOOR         minimum score per route (default `0.9`).
 *   LIGHTHOUSE    CLI version (default `13.4.1`) — pinned, because a score that moves with
 *                 the tool isn't a gate, it's a coin flip.
 *
 * Exit: 0 if every route reaches the floor; 1 (with `::error::`) on the first that doesn't.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROUTES, routeSlug } from './ui-routes.mjs';

const BASE = (process.env.PREVIEW_URL || '').trim();
const FLOOR = Number(process.env.FLOOR || 0.9);
const VERSION = (process.env.LIGHTHOUSE || '13.4.1').trim();

/**
 * Mobile emulation ON, `screenEmulation` at 375 (the narrowest of the three viewports — the
 * real device width most of the audience uses). Lighthouse's default is a throttled Moto G,
 * which measures PERFORMANCE; here we measure accessibility, and the throttling would only
 * add variance to the number without changing what it says.
 */
const ARGS = [
	'--only-categories=accessibility',
	'--output=json',
	'--quiet',
	'--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
	'--form-factor=mobile',
	'--screenEmulation.mobile',
	'--screenEmulation.width=375',
	'--screenEmulation.height=812',
	'--screenEmulation.deviceScaleFactor=1',
	'--throttling-method=provided'
];

/** The Chromium Playwright already downloaded. Without it Lighthouse looks for a system Chrome. */
function findChromium() {
	if ((process.env.CHROME_PATH || '').trim() !== '') return process.env.CHROME_PATH.trim();
	const r = spawnSync(
		process.execPath,
		['-e', "import('playwright-core').then((p) => console.log(p.chromium.executablePath()))"],
		{ encoding: 'utf8' }
	);
	return r.status === 0 ? r.stdout.trim() : '';
}

function measure(url, destination, chrome) {
	const file = join(destination, `${routeSlug(new URL(url).pathname)}.json`);
	// `shell` only on win32, out of necessity, not convenience: since Node 20.12 `spawn`
	// refuses to run `.cmd`/`.bat` without a shell (the CVE-2024-27980 fix), and on Windows
	// `npx` IS a `.cmd`. On Linux (where this actually runs in CI) `argv` is exec'd directly,
	// with no shell to interpolate into at all. `url`'s route now comes from
	// `project/docs/screens.yaml` (DECISIONS.md D-012) and is validated by `ui-routes.mjs`'s
	// `SAFE_ROUTE` check before it ever reaches here; everything else is a constant in this
	// file.
	const argv = ['-y', `lighthouse@${VERSION}`, url, ...ARGS, `--output-path=${file}`];
	const r = spawnSync('npx', argv, {
		shell: process.platform === 'win32',
		encoding: 'utf8',
		env: { ...process.env, CHROME_PATH: chrome },
		timeout: 180_000
	});
	if (r.status !== 0) {
		throw new Error(
			`\`lighthouse\` exited ${r.status}${r.error ? ` (${r.error.message})` : ''} on ${url}: ` +
				`${`${r.stdout || ''}${r.stderr || ''}`.trim().slice(-600)}`
		);
	}
	const report = JSON.parse(readFileSync(file, 'utf8'));
	const score = report?.categories?.accessibility?.score;
	if (typeof score !== 'number') {
		throw new Error(`the report for ${url} didn't carry an accessibility score.`);
	}
	// The failed audits, so the error says WHAT dragged the score down — not just that it did.
	const failed = Object.values(report.audits || {})
		.filter((a) => a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative')
		.map((a) => a.id);
	return { score, failed };
}

function main() {
	if (BASE === '') {
		console.log(
			'::error::No `PREVIEW_URL`. The Lighthouse gate measures a SERVED page — run ' +
				'`npm run build && npm run preview` and point `PREVIEW_URL=http://localhost:4173`.'
		);
		return 1;
	}

	const chrome = findChromium();
	if (chrome === '') {
		console.log(
			'::error::Could not find Playwright\'s Chromium. Run the browser install step for the ' +
				'active profile, or point `CHROME_PATH` at an installed Chrome.'
		);
		return 1;
	}

	const destination = mkdtempSync(join(tmpdir(), 'lh-a11y-'));
	const failures = [];
	try {
		for (const route of ROUTES) {
			const url = new URL(route, BASE).toString();
			let result;
			try {
				result = measure(url, destination, chrome);
			} catch (error) {
				console.log(`::error::Failed to measure ${url}: ${error.message}`);
				return 1;
			}
			const passed = result.score >= FLOOR;
			console.log(
				`${passed ? 'ok  ' : 'FAIL'}  ${result.score.toFixed(2)}  ${route}` +
					(result.failed.length > 0 ? `  (${result.failed.join(', ')})` : '')
			);
			if (!passed) failures.push({ route, ...result });
		}
	} finally {
		rmSync(destination, { recursive: true, force: true });
	}

	if (failures.length === 0) {
		console.log(`Lighthouse a11y >= ${FLOOR} on all ${ROUTES.length} UI route(s).`);
		return 0;
	}

	for (const f of failures) {
		console.log(
			`::error::Lighthouse a11y ${f.score.toFixed(2)} < ${FLOOR} on ${f.route}. ` +
				`Failed audits: ${f.failed.join(', ') || '(none named)'}. ` +
				'WCAG 2.2 AA is a non-negotiable floor for this factory.'
		);
	}
	return 1;
}

process.exit(main());
