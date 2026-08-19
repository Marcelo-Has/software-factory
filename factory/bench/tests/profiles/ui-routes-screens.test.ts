import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadRoutes } from '../../../../.github/scripts/ui-routes.mjs';

/**
 * `ui-routes.mjs`'s `loadRoutes` (DECISIONS.md D-012): ROUTES now derives from
 * `project/docs/screens.yaml` when it exists. Planted-violation pair: a clean fixture with a
 * plain route, a parameterized route with `screenshot_route`, and a route-less email screen
 * (excluded); a violated fixture with a parameterized route missing `screenshot_route`
 * (fails closed); a violated fixture with a route containing shell/URL metacharacters (fails
 * closed on `SAFE_ROUTE` — the regression test for the security review's H-1 fix, which
 * closed a command-injection path into `lighthouse-a11y.mjs`'s URL/command line).
 */

const FIXTURES = join(process.cwd(), 'factory', 'bench', 'tests', 'profiles', 'fixtures');

describe('loadRoutes', () => {
	it('falls back to the [\'/\'] placeholder when there is no screens.yaml', () => {
		let dir: string;
		dir = mkdtempSync(join(tmpdir(), 'ui-routes-empty-'));
		try {
			expect(loadRoutes(dir)).toEqual(['/']);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('reads every screen with a route, in file order, substituting screenshot_route for a parameterized route', () => {
		expect(loadRoutes(join(FIXTURES, 'screens-clean'))).toEqual(['/', '/notes/example']);
	});

	it('excludes a screen with no route field (e.g. an email)', () => {
		const routes = loadRoutes(join(FIXTURES, 'screens-clean'));
		expect(routes).toHaveLength(2);
	});

	it('fails closed on a parameterized route with no screenshot_route', () => {
		expect(() => loadRoutes(join(FIXTURES, 'screens-violated-missing-screenshot-route'))).toThrow(
			/screenshot_route/
		);
	});

	it('fails closed on a route containing shell/URL metacharacters', () => {
		expect(() => loadRoutes(join(FIXTURES, 'screens-violated-unsafe-route'))).toThrow(
			/must be a plain absolute path/
		);
	});
});
