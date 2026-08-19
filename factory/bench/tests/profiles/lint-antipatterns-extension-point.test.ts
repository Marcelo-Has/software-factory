import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveExtensionPoint } from '../../../../.github/scripts/lint-antipatterns.mjs';

/**
 * `lint-antipatterns.mjs`'s "profile extension point" (DECISIONS.md D-012): resolves via
 * `gateAdaptation('lint_antipatterns_selectors')` when a profile exists, falls back to the
 * built-in SvelteKit values otherwise. The module-level `ROOTS`/`EXTENSIONS`/etc. constants
 * that the rest of the script actually uses are evaluated once at import time against the
 * real repo (no profile on `main` today) — this test exercises `resolveExtensionPoint`
 * directly against fixture cwds instead, since re-importing the module per fixture isn't
 * possible under ESM's module cache. `factory/bench/tests/design/antipatterns.test.ts` stays
 * untouched and keeps proving the no-profile default path bites.
 */

const FIXTURES = join(process.cwd(), 'factory', 'bench', 'tests', 'profiles', 'fixtures');

describe('resolveExtensionPoint', () => {
	it('falls back to the built-in SvelteKit values with no profile', () => {
		const resolved = resolveExtensionPoint(join(FIXTURES, 'screens-clean'));
		expect(resolved.roots).toEqual(['app/web/src']);
		expect(resolved.extensions).toEqual(['.svelte', '.css', '.html']);
		expect(resolved.frameworkScrollDirectiveSource).toBe('on:scroll');
		expect(resolved.ignoredDirs.has('node_modules')).toBe(true);
	});

	it('falls back to the built-in values when a valid profile exists but declares no matching adaptation', () => {
		// The `clean` fixture's modules declare other gate_adaptations keys (demo_key,
		// generic_gate_note, preview_url_adapter) but none named `lint_antipatterns_selectors`.
		const resolved = resolveExtensionPoint(join(FIXTURES, 'clean'));
		expect(resolved.roots).toEqual(['app/web/src']);
	});
});
