import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { routeSlug } from '../../../../.github/scripts/ui-routes.mjs';

/**
 * Test of the visual-evidence infrastructure.
 *
 * What's being protected here isn't the capture itself (that depends on a browser and a served
 * URL, and CI exercises it for real against the deploy preview) — it's the **path
 * convention**: `artifacts/screenshots/<route>-<viewport>.png`. `design-critic` looks for
 * evidence at exactly that path and rejects the PR when it's missing; if the convention
 * changes in silence, the critic starts rejecting correct PRs for not finding a file that
 * exists under a different name.
 *
 * The script is ACTUALLY RUN, the same way `design-md.test.ts` runs its gate: reimplementing
 * the rule inside the test would only prove it can be written twice. The `--list` mode exists
 * for this (and so the evidence gate can ask the script itself which files a complete round
 * has to produce).
 */

const SCRIPT = join(process.cwd(), '.github', 'scripts', 'screenshots.mjs');
const VIEWPORTS = [375, 768, 1280];

function run(args: string[], env: Record<string, string> = {}) {
	const r = spawnSync(process.execPath, [SCRIPT, ...args], {
		encoding: 'utf8',
		env: { ...process.env, PREVIEW_URL: '', ...env }
	});
	return { code: r.status, output: `${r.stdout}${r.stderr}` };
}

describe('screenshot path convention', () => {
	const { code, output } = run(['--list']);
	const files = output.trim().split('\n');

	it('lists with no browser launch and exits 0', () => {
		expect(code).toBe(0);
		expect(files.length).toBeGreaterThan(0);
	});

	it('writes everything under `artifacts/screenshots/`, as `<route>-<viewport>.png`, no slash in the name', () => {
		for (const file of files) {
			expect(file).toMatch(/^artifacts\/screenshots\/[a-z0-9-]+-(375|768|1280)\.png$/);
		}
	});

	it('covers all three widths, with the same routes at each one', () => {
		const perViewport = VIEWPORTS.map((v) =>
			files.filter((a) => a.endsWith(`-${v}.png`)).map((a) => a.replace(`-${v}.png`, ''))
		);
		expect(perViewport.map((r) => r.length)).toEqual([
			perViewport[0].length,
			perViewport[0].length,
			perViewport[0].length
		]);
		expect(perViewport[0].length).toBeGreaterThan(0);
		expect(perViewport[1]).toEqual(perViewport[0]);
		expect(perViewport[2]).toEqual(perViewport[0]);
	});

	it('names the root `home`', () => {
		expect(files).toContain('artifacts/screenshots/home-375.png');
	});

	it('does not repeat a file — two routes never collide on the same PNG', () => {
		expect(new Set(files).size).toBe(files.length);
	});
});

/**
 * The route-flattening convention itself, tested directly through `routeSlug` rather than
 * through the file list above: this generic core ships `ui-routes.mjs`'s `ROUTES` as a single
 * placeholder (`['/']`, see that file's "profile extension point" header) until a real
 * product's app exists, so there is no nested route in the placeholder list to prove the
 * hyphen-flattening behavior against. The convention still has to hold once a real route
 * exists, and this is what proves it does.
 */
describe('route-to-filename convention (routeSlug)', () => {
	it('flattens a nested route with a hyphen, no leading or trailing slash', () => {
		expect(routeSlug('/order/canceled')).toBe('order-canceled');
	});

	it('names the root route `home`', () => {
		expect(routeSlug('/')).toBe('home');
	});

	it('drops a query string or a hash before slugging', () => {
		expect(routeSlug('/order/canceled?ref=email')).toBe('order-canceled');
		expect(routeSlug('/order/canceled#top')).toBe('order-canceled');
	});
});

describe('fail-closed', () => {
	it('exits 1 and states why when it receives no URL at all', () => {
		const { code, output } = run([]);
		expect(code).toBe(1);
		expect(output).toContain('::error::');
		expect(output).toContain('evidence');
	});
});
