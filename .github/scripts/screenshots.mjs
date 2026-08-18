#!/usr/bin/env node
/**
 * Visual evidence for the Visual Verification Loop.
 *
 * Captures every UI route at the THREE viewports (375 / 768 / 1280) against an already-served
 * URL (the PR's deploy preview in CI; a local `npm run preview` by hand) and writes one PNG
 * per route per width.
 *
 * PATH CONVENTION — FIXED, and it's a contract, not an implementation detail:
 *
 *     artifacts/screenshots/<route>-<viewport>.png
 *
 * `<route>` is the URL path without the leading slash, with `/` swapped for `-`; the root
 * (`/`) is `home`. `<viewport>` is the width in px, no unit — `home-375.png`,
 * `order-canceled-1280.png`. `design-critic.yml` READS this path to find the evidence, and its
 * absence rejects the PR outright: that's why the convention is fixed here, covered by a
 * dedicated test, and exposed via `--list` (which prints exactly the files a complete round
 * has to produce, without launching a browser).
 *
 * NO MCP: this calls Playwright directly as a library. A browser MCP server would be one more
 * runtime dependency in CI's path to do what `page.screenshot` already does.
 *
 * Usage:
 *     node .github/scripts/screenshots.mjs https://deploy-preview-1--site.netlify.app
 *     PREVIEW_URL=http://localhost:4173 node .github/scripts/screenshots.mjs
 *     node .github/scripts/screenshots.mjs --list
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright-core';
// The route list, the viewports, and the path convention live in `ui-routes.mjs`: the
// viewport gate needs to IMPORT the same list, and this module calls `process.exit` at the
// top — whoever imports it dies along with it. The re-export keeps `screenshots.mjs` as the
// facade callers already expect.
import {
	DIRECTORY,
	ROUTES,
	VIEWPORTS,
	filePathFor,
	listFiles,
	routeSlug
} from './ui-routes.mjs';

export { DIRECTORY, ROUTES, VIEWPORTS, filePathFor, listFiles, routeSlug };

/**
 * Captures everything and returns the list of files written.
 *
 * Browser: Playwright's BUNDLED Chromium, with the sandbox ON — not a system Chrome with
 * `--no-sandbox`. The difference is deliberate: the page here comes from a remote URL (the
 * deploy preview), navigated content that the sandbox exists to contain.
 */
export async function capture({ baseUrl, routes = ROUTES, viewports = VIEWPORTS, destination = '.' }) {
	const browser = await chromium.launch();
	const generated = [];
	try {
		for (const { width, height } of viewports) {
			const context = await browser.newContext({
				viewport: { width, height },
				deviceScaleFactor: 1,
				locale: 'en-US',
				// The evidence is static: an animation mid-flight at capture time would produce a
				// different PNG every round and turn "nothing changed" into noise. The captured
				// state is what the design contract declares for `prefers-reduced-motion`.
				reducedMotion: 'reduce'
			});
			const page = await context.newPage();
			for (const route of routes) {
				const url = new URL(route, baseUrl).toString();
				const response = await page.goto(url, { waitUntil: 'load', timeout: 45_000 });
				const status = response?.status() ?? 0;
				if (status >= 400) {
					throw new Error(`${url} responded ${status} — no evidence to capture for this route.`);
				}
				// Capturing before self-hosted fonts (`font-display: swap`) finish loading
				// photographs the fallback, and the evidence would show a typeface the product
				// doesn't have. `.then(() => true)` because `document.fonts` isn't serializable.
				// The `evaluate` body runs INSIDE the page, in the browser, not in this Node
				// process (where `document` genuinely doesn't exist).
				// eslint-disable-next-line no-undef
				await page.evaluate(() => document.fonts.ready.then(() => true));
				await page.waitForTimeout(300);

				const path = join(destination, filePathFor(route, width));
				await mkdir(dirname(path), { recursive: true });
				await page.screenshot({ path, fullPage: true });
				generated.push(filePathFor(route, width));
				console.log(`${width}px  ${route}  ->  ${filePathFor(route, width)}`);
			}
			await context.close();
		}
	} finally {
		await browser.close();
	}
	return generated;
}

async function main(argv) {
	if (argv.includes('--list')) {
		console.log(listFiles().join('\n'));
		return 0;
	}

	const baseUrl = (argv.find((a) => !a.startsWith('--')) ?? process.env.PREVIEW_URL ?? '').trim();
	if (baseUrl === '') {
		console.log(
			'::error::No URL to capture. Pass the deploy preview URL as an argument ' +
				'(`node .github/scripts/screenshots.mjs <url>`) or in `PREVIEW_URL`. ' +
				'Without screenshots there is no Visual Verification Loop evidence, and without ' +
				'evidence `design-critic` rejects the PR outright.'
		);
		return 1;
	}

	try {
		const generated = await capture({ baseUrl });
		console.log(`${generated.length} screenshot(s) in \`${DIRECTORY}/\`, from ${baseUrl}.`);
		return 0;
	} catch (error) {
		console.log(`::error::Failed to capture visual evidence: ${error.message}`);
		return 1;
	}
}

process.exit(await main(process.argv.slice(2)));
