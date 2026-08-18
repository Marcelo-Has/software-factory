import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Test of the deterministic "DESIGN.md exists and is approved" gate.
 *
 * This gate separates "the factory may write UI" from "the factory is inventing a visual
 * identity on its own", and it decides that with no human watching. Two ways to get it wrong,
 * and both hurt: rejecting too little re-opens the gap this gate exists to close (UI with no
 * visual language of its own); rejecting too much blocks every PR in the repository.
 *
 * The script is ACTUALLY RUN, the same way `factory/bench/tests/workflows/reentry.test.ts`
 * does with `daily-report.yml`'s filter: what matters here is the EXIT CODE, and
 * reimplementing the rule in the test would only prove it can be written twice.
 */

const GATE = join(process.cwd(), '.github', 'scripts', 'gate-design-md.mjs');

/** A minimal `DESIGN.md` with the §0 header table, in the shape of `factory/templates/DESIGN-template.md`. */
function design(status: string): string {
	return [
		'# DESIGN.md — test project',
		'',
		'| Field | Value |',
		'| --- | --- |',
		`| **Status** | ${status} |`,
		''
	].join('\n');
}

const APPROVED = design('`approved`');
const CANDIDATE = design('`candidate`');
// A raw copy of the template: the placeholder and the invalid Status arrive together, which is
// the state a new project finds the file in.
const TEMPLATE = design('`[TO FILL IN]` — `candidate` \\| `approved`');

let dir: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'gate-design-'));
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

/**
 * Writes `DESIGN.md` at `project/design/DESIGN.md` under a temp directory and runs the gate
 * there. `content === null` = `DESIGN.md` doesn't exist. `FILES`/`BASE_SHA` are zeroed before
 * applying the case's own env, so the CI environment can't leak into the test.
 */
function run(
	content: string | null,
	env: Record<string, string> = {}
): { code: number | null; output: string } {
	if (content !== null) {
		mkdirSync(join(dir, 'project', 'design'), { recursive: true });
		writeFileSync(join(dir, 'project', 'design', 'DESIGN.md'), content);
	}
	const r = spawnSync(process.execPath, [GATE], {
		cwd: dir,
		encoding: 'utf8',
		env: { ...process.env, FILES: '', BASE_SHA: '', ...env }
	});
	return { code: r.status, output: `${r.stdout}${r.stderr}` };
}

const ONE_UI_FILE = { FILES: 'app/web/src/routes/+page.svelte' };

describe('DESIGN.md gate', () => {
	it('must reject when the PR touches UI and project/design/DESIGN.md does not exist', () => {
		const { code, output } = run(null, ONE_UI_FILE);
		expect(code).toBe(1);
		expect(output).toContain('::error::');
		expect(output).toContain('`project/design/DESIGN.md` does not exist');
	});

	it('must reject when DESIGN.md is still the template, with [TO FILL IN]', () => {
		const { code, output } = run(TEMPLATE, ONE_UI_FILE);
		expect(code).toBe(1);
		expect(output).toContain('[TO FILL IN]');
	});

	it('must reject when Status is candidate, not approved', () => {
		const { code, output } = run(CANDIDATE, ONE_UI_FILE);
		expect(code).toBe(1);
		expect(output).toContain('Status: candidate');
	});

	it('must reject when the Status field is missing from the header', () => {
		const { code, output } = run('# DESIGN.md\n\nno header at all\n', ONE_UI_FILE);
		expect(code).toBe(1);
		expect(output).toContain('has no `Status` field');
	});

	it('must approve when the PR touches UI and DESIGN.md is approved', () => {
		const { code, output } = run(APPROVED, ONE_UI_FILE);
		expect(code).toBe(0);
		expect(output).not.toContain('::error::');
	});

	it('must check unconditionally when there is no file list (fail-closed)', () => {
		const { code, output } = run(null);
		expect(code).toBe(1);
		expect(output).toContain('unconditionally');
	});

	it('must check unconditionally when git cannot diff (fail-closed)', () => {
		// A temp directory is not a git repository: `git diff` fails and the gate CANNOT go quiet.
		const { code, output } = run(null, { BASE_SHA: '0000000000000000000000000000000000000000' });
		expect(code).toBe(1);
		expect(output).toContain('::warning::');
		expect(output).toContain('::error::');
	});

	it('must let an approved PR through even with no file list', () => {
		expect(run(APPROVED).code).toBe(0);
	});

	// The list mirrors the repository's real structure (`app/web/src/routes/**/*.svelte`,
	// `app/web/src/app.html`) plus `app/web/src/app.css`, the first thing a UI task creates.
	it.each([
		'app/web/src/routes/+page.svelte',
		'app/web/src/routes/questionnaire/[step]/+page.svelte',
		'app/web/src/lib/components/Button.svelte',
		'app/web/src/app.css',
		'app/web/src/app.html',
		'project/design/DESIGN.md'
	])('must treat %s as interface code', (path) => {
		expect(run(null, { FILES: `project/docs/DECISIONS.md\n${path}` }).code).toBe(1);
	});

	// Build output belongs here on purpose: `.svelte-kit/` and `build/` are full of compiled
	// `.css`, and without the pruning any PR that rebuilds the app would match the style
	// pattern.
	it.each([
		'app/api/src/order.ts',
		'app/web/src/routes/api/orders/checkout/+server.ts',
		'project/docs/DECISIONS.md',
		'app/api/src/index.ts',
		'.github/workflows/ci.yml',
		'.svelte-kit/output/client/_app/immutable/assets/_page.css',
		'build/client/_app/immutable/assets/_layout.css',
		'artifacts/_raw/style.css'
	])('must not block a PR that only touches %s', (path) => {
		expect(run(null, { FILES: path }).code).toBe(0);
	});
});
