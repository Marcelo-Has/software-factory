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
 * module has no side effects and no dependency, so it's safely importable by scripts and
 * by tests alike.
 *
 * PROFILE EXTENSION POINT — ROUTES. This generic core ships with app/ empty, so there is no
 * real route list yet: `ROUTES` below is a single placeholder. Once a profile's app exists,
 * replace it with the product's actual routes (explicit list, not a glob over the app's
 * router directory — a dynamic route has no screenshot without a concrete instance, and the
 * chosen instance belongs here, visible, rather than guessed by a scan). A new UI route
 * needs a new line here, or it never produces evidence and never runs through the viewport
 * gate.
 */

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
 * The product's UI routes. Placeholder until a profile's app/ exists — see the header.
 */
export const ROUTES = ['/'];

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
