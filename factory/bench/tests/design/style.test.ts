import { existsSync } from 'node:fs';
import stylelint from 'stylelint';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Gate 1 (tokens compliance) running against PLANTED VIOLATIONS.
 *
 * A gate that's never been seen rejecting is a promise, not a control. Here, real `stylelint`
 * runs against `factory/bench/tests/design/fixtures/`, where each file plants one case and
 * declares the expected outcome in its own header comment.
 *
 * The pair that matters is always the same: the violation REJECTS **and** the fixed version
 * RETURNS TO GREEN. Only the first half would prove the gate complains; both together prove it
 * complains about the right thing.
 *
 * The config under test is `factory/profiles/frontend/sveltekit/stylelint.config.js` — the
 * `frontend/sveltekit` profile module's `gate_adaptations` (DECISIONS.md D-010, see
 * `factory/profiles/PROFILES.md`). It is not wired into any product `lint` script yet — that
 * resolver is EVP3 (`PROFILES.md` §6); only these fixtures exercise it here, to prove the gate
 * mechanism bites. The final sub-test below, which lints the live product's own source, is
 * guarded and skips on the empty skeleton (no `app/web` yet) — same pattern `ci.yml` uses for
 * product jobs.
 */

const FIXTURES = 'factory/bench/tests/design/fixtures';
const CONFIG = 'factory/profiles/frontend/sveltekit/stylelint.config.js';

interface Result {
	rejected: boolean;
	rules: string[];
	text: string;
}

/**
 * Runs real stylelint, through the Node API.
 *
 * Through the API and not the CLI, on purpose: several `npx stylelint` calls in series cost
 * over a minute in this suite and, running alongside the rest of `vitest`, saturated the
 * machine enough to blow the timeout of UNRELATED tests. A gate that only passes when it runs
 * alone isn't a gate. The config loaded is the SAME one a product's `lint:style` script would
 * use — nothing is reimplemented here.
 */
async function run(files: string[]): Promise<Result> {
	const r = await stylelint.lint({ files, configFile: CONFIG, formatter: 'string' });
	const rules = r.results.flatMap((f) => f.warnings.map((w) => w.rule));
	return { rejected: r.errored === true, rules: [...new Set(rules)], text: r.report };
}

const fixture = (file: string) => run([`${FIXTURES}/${file}`]);

describe('tokens gate — planted violation rejects', () => {
	let result: Result;
	beforeAll(async () => {
		result = await fixture('tokens-violated.css');
	});

	it('rejects', () => {
		expect(result.rejected, result.text).toBe(true);
	});

	it('catches a literal color outside the token system (antipattern 30)', () => {
		expect(result.rules).toContain('declaration-property-value-disallowed-list');
	});

	it('catches spacing, radius, shadow, and typography outside the DESIGN.md scale', () => {
		expect(result.rules).toContain('declaration-property-value-allowed-list');
	});
});

describe('tokens gate — returns to green with no residual false positive', () => {
	it('the same block, derived from the tokens, passes clean', async () => {
		const result = await fixture('tokens-clean.css');
		expect(result.rejected, result.text).toBe(false);
		expect(result.rules).toEqual([]);
	});
});

describe('the allowlist is explicit: an unjustified exception and a useless one are both findings', () => {
	it('rejects `stylelint-disable` with no `--` and reason', async () => {
		const result = await fixture('tokens-anonymous-exception.css');
		expect(result.rejected, result.text).toBe(true);
		expect(result.text).toMatch(/descriptionless/i);
	});

	it('rejects an exception that no longer silences anything (the residual false positive)', async () => {
		const result = await fixture('tokens-needless-exception.css');
		expect(result.rejected, result.text).toBe(true);
		expect(result.text).toMatch(/needless/i);
	});

	it('accepts an exception that silences a real finding AND says why', async () => {
		const result = await fixture('tokens-justified-exception.css');
		expect(result.rejected, result.text).toBe(false);
	});
});

describe.skipIf(!existsSync('app/web/src'))('the live product passes its own gate', () => {
	it('`app/web/src/**` has no hand-written design value', async () => {
		const result = await run(['app/web/src/**/*.{css,svelte}']);
		expect(result.rejected, result.text).toBe(false);
	});
});
