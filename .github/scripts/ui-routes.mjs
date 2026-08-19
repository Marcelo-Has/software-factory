/**
 * The product's UI routes and the three viewports from the active DESIGN.md — the single
 * source of truth.
 *
 * WHY THIS FILE EXISTS. The route/viewport list is a contract: `design-critic.yml` looks
 * for evidence under `artifacts/screenshots/` by this convention, and
 * `check-visual-evidence.mjs` asks this module which files to expect instead of
 * reimplementing the rule. `lighthouse-a11y.mjs` and `screenshots.mjs` both import it too —
 * a captured page and a measured page must be the same page. `screenshots.mjs` calls
 * `process.exit` at module top level, so importing it would kill whoever imports it; this
 * module has no CLI and no top-level `process.exit` of its own, so it's safely importable by
 * scripts and by tests alike.
 *
 * ROUTES SOURCE (DECISIONS.md D-012). `ROUTES` derives from `project/docs/screens.yaml` —
 * every screen with a `route` field, in file order (`loadRoutes` does the reading; exported so
 * tests can point it at a fixture directory). This generic core ships with no product, so no
 * `screens.yaml` exists yet: `ROUTES` falls back to today's single placeholder, `['/']`. A
 * parameterized route (containing `:`) needs the screen's `screenshot_route` field — a
 * concrete instance, e.g. `screenshot_route: /notes/example` for `route: /notes/:id` — and
 * `loadRoutes` throws a clear error when that's missing: a dynamic route has no screenshot
 * without a chosen concrete instance, and that choice belongs in `screens.yaml`, visible,
 * rather than guessed by a scan.
 *
 * NO DEPENDENCY, on purpose. This module is reachable — via `check-visual-evidence.mjs`,
 * `critic-verdict.mjs`, `await-screenshots.mjs` — from `design-critic.yml`'s job, which never
 * runs `npm ci` (`factory/bench/tests/workflows/visual-evidence.test.ts` proves this by
 * running those scripts with no `node_modules` present at all). A `yaml` package import here
 * would break every one of them the moment a real `screens.yaml` exists. `parseScreens` below
 * is a bespoke, line-oriented scan of `screens.yaml`'s fixed shape
 * (`factory/templates/screens-template.yaml`) — the same posture `gate-contracts.mjs`'s own
 * `parseScenarios` already takes for Gherkin: this repo's own artifacts are simple enough that
 * a full parser dependency buys nothing but a hidden failure mode. It only needs three scalar
 * fields per screen (`id`, `route`, `screenshot_route`), each a single-line value.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A screen's scalar value, unquoted; `''`/`null`/`~` (YAML's null spellings) -> `undefined`.
 * @param {string} raw
 * @returns {string | undefined}
 */
function scalarValue(raw) {
	const v = raw.trim();
	if (v === '' || v === 'null' || v === '~') return undefined;
	if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
		return v.slice(1, -1);
	}
	return v;
}

/**
 * Parses `screens.yaml`'s `screens:` list into `{ id, route, screenshot_route }` objects, in
 * file order. Ignores every other field (`name`, `area`, `states`, `mockup_states`, ...) —
 * this module only needs routes. See the header for why this isn't a real YAML parser.
 * @param {string} text
 * @returns {{ id?: string, route?: string, screenshot_route?: string }[]}
 */
function parseScreens(text) {
	const screens = [];
	let current = null;
	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.replace(/\s+#.*$/, '');
		const itemStart = line.match(/^ {2}- (\w+):\s*(.*)$/);
		if (itemStart) {
			current = {};
			screens.push(current);
			current[itemStart[1]] = scalarValue(itemStart[2]);
			continue;
		}
		if (current === null) continue;
		const field = line.match(/^ {4}(\w+):\s*(.*)$/);
		if (field) {
			current[field[1]] = scalarValue(field[2]);
			continue;
		}
		if (/^\S/.test(line)) current = null;
	}
	return screens;
}

/** The visual-evidence directory. Relative to the repository root. */
export const DIRECTORY = 'artifacts/screenshots';

/**
 * The three widths from the Visual Verification Loop, with a fixed height. Height doesn't
 * enter the filename (the convention is `<route>-<viewport>`) but has to be deterministic:
 * the screenshot is `fullPage`, and the viewport height decides where the FIRST FOLD falls
 * inside the image — the design contract may require the signature/hero to appear above it.
 */
export const VIEWPORTS = [
	{ width: 375, height: 812 },
	{ width: 768, height: 1024 },
	{ width: 1280, height: 800 }
];

/**
 * Reads `project/docs/screens.yaml` and returns every screen's route, in file order. No
 * `screens.yaml` -> `['/']` (today's placeholder). A parameterized route with no
 * `screenshot_route` throws — see the header.
 * @param {string} [cwd]
 * @returns {string[]}
 */
export function loadRoutes(cwd = process.cwd()) {
	const path = join(cwd, 'project', 'docs', 'screens.yaml');
	if (!existsSync(path)) return ['/'];
	const screens = parseScreens(readFileSync(path, 'utf8'));
	const routes = [];
	for (const screen of screens) {
		if (!screen.route) continue;
		if (screen.route.includes(':')) {
			if (!screen.screenshot_route) {
				throw new Error(
					`project/docs/screens.yaml: screen "${screen.id}" has a parameterized route ` +
						`(${screen.route}) with no \`screenshot_route\` — a concrete instance is required, ` +
						'e.g. `screenshot_route: /notes/example` (DECISIONS.md D-012).'
				);
			}
			routes.push(screen.screenshot_route);
		} else {
			routes.push(screen.route);
		}
	}
	return routes;
}

/**
 * The product's UI routes — see the header.
 */
export const ROUTES = loadRoutes();

/**
 * `/` -> `home`; `/order/canceled` -> `order-canceled`. No slash in the filename.
 * @param {string} route
 * @returns {string}
 */
export function routeSlug(route) {
	const clean = route.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
	return clean === '' ? 'home' : clean.replace(/\//g, '-');
}

/**
 * The path fixed by convention, always with `/` (CI is Linux and the critic reads a string).
 * @param {string} route
 * @param {number} width
 * @returns {string}
 */
export function filePathFor(route, width) {
	return `${DIRECTORY}/${routeSlug(route)}-${width}.png`;
}

/** Every file a complete round produces, in the order they're generated. */
export function listFiles(routes = ROUTES, viewports = VIEWPORTS) {
	return viewports.flatMap(({ width }) => routes.map((route) => filePathFor(route, width)));
}
