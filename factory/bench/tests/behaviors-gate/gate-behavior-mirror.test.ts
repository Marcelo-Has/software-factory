import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	checkBehaviorMirror,
	mirrorPathTemplates,
	touchesBehaviorMirror
} from '../../../../.github/scripts/gate-behavior-mirror.mjs';

/**
 * Test of the DP-3 behaviors-mirror execution gate (DECISIONS.md D-013). Three halves, the
 * planted-violation tradition: the mapping-template parser exercised directly; the
 * full-coverage check (`checkBehaviorMirror`) exercised against the synthetic fixture trees
 * in `fixtures/` (self-contained — their own `project/state/profile.json` AND their own
 * `factory/profiles/backend/demo-be/` module, never the real registry, same reason D-012's
 * own fixtures don't reuse `data-auth/baas`); and the CLI exercised as a subprocess for the
 * applicability/env-var contract and the `--print-test-command` flag.
 */

const GATE = join(process.cwd(), '.github', 'scripts', 'gate-behavior-mirror.mjs');
const FIXTURES = join(process.cwd(), 'factory', 'bench', 'tests', 'behaviors-gate', 'fixtures');

describe('mirrorPathTemplates', () => {
	it('extracts the mirror and feature path templates from a well-formed mapping', () => {
		const manifest = {
			behaviors: {
				mapping: 'app/api/tests/behaviors/<feature>.test.ts mirrors project/docs/behaviors/<feature>.feature, one file per feature area'
			}
		};
		// The regex splits on whitespace only, so a trailing comma right after the feature
		// path (as every real module.yaml's mapping prose has) rides along in the token —
		// harmless, since only mirrorTemplate is actually used to resolve a path.
		expect(mirrorPathTemplates(manifest)).toEqual({
			mirrorTemplate: 'app/api/tests/behaviors/<feature>.test.ts',
			featureTemplate: 'project/docs/behaviors/<feature>.feature,'
		});
	});

	it('returns null when the mapping does not start with the expected shape', () => {
		expect(mirrorPathTemplates({ behaviors: { mapping: 'some other prose entirely' } })).toBeNull();
	});

	it('returns null when mapping is not a string (e.g. null, not applicable)', () => {
		expect(mirrorPathTemplates({ behaviors: { mapping: null } })).toBeNull();
	});
});

describe('checkBehaviorMirror against synthetic fixture trees', () => {
	it('passes fully on the clean fixture', () => {
		const r = checkBehaviorMirror(join(FIXTURES, 'clean'));
		expect(r.ok).toBe(true);
		expect(r.findings).toEqual([]);
		expect(r.reason).toBeUndefined();
	});

	it('rejects a .feature with no mirror file at all', () => {
		const r = checkBehaviorMirror(join(FIXTURES, 'violated-missing-mirror'));
		expect(r.ok).toBe(false);
		expect(r.findings).toHaveLength(1);
		expect(r.findings[0].code).toBe('mirror-missing');
	});

	it('rejects a feature scenario with no matching comment in the mirror', () => {
		const r = checkBehaviorMirror(join(FIXTURES, 'violated-missing-scenario-comment'));
		expect(r.ok).toBe(false);
		expect(r.findings).toHaveLength(1);
		expect(r.findings[0].code).toBe('scenario-uncovered');
		expect(r.findings[0].message).toContain('create-widget');
	});

	it('rejects an orphan @scenario comment in the mirror not present in the .feature', () => {
		const r = checkBehaviorMirror(join(FIXTURES, 'violated-orphan-comment'));
		expect(r.ok).toBe(false);
		expect(r.findings).toHaveLength(1);
		expect(r.findings[0].code).toBe('mirror-comment-orphan');
		expect(r.findings[0].message).toContain('delete-widget');
	});

	it('rejects a mirror with zero test(/it( calls (placeholder)', () => {
		const r = checkBehaviorMirror(join(FIXTURES, 'violated-placeholder-mirror'));
		expect(r.ok).toBe(false);
		expect(r.findings).toHaveLength(1);
		expect(r.findings[0].code).toBe('mirror-placeholder');
	});

	it('right-sizes to ok with a reason when there is no active profile', () => {
		const r = checkBehaviorMirror(join(FIXTURES, 'no-product'));
		expect(r.ok).toBe(true);
		expect(r.findings).toEqual([]);
		expect(r.reason).toMatch(/no active profile/i);
	});

	it('right-sizes to ok with a reason when the backend module declares behaviors.applicable: false', () => {
		const r = checkBehaviorMirror(join(FIXTURES, 'no-behaviors'));
		expect(r.ok).toBe(true);
		expect(r.findings).toEqual([]);
		expect(r.reason).toMatch(/applicable: false/);
	});

	it('right-sizes to ok with a reason when there are no .feature files yet', () => {
		const r = checkBehaviorMirror(join(FIXTURES, 'no-scenarios'));
		expect(r.ok).toBe(true);
		expect(r.findings).toEqual([]);
		expect(r.reason).toMatch(/no behavior scenarios/i);
	});
});

describe('touchesBehaviorMirror', () => {
	it('treats project/docs/behaviors/ paths as relevant (delegates to touchesContracts)', () => {
		expect(touchesBehaviorMirror('project/docs/behaviors/widgets.feature', join(FIXTURES, 'clean'))).toBe(true);
	});

	it('treats the resolved mirror directory as relevant when a backend module resolves', () => {
		expect(
			touchesBehaviorMirror('app/api/tests/behaviors/widgets.mirror.ts', join(FIXTURES, 'clean'))
		).toBe(true);
	});

	it('does not treat an unrelated path as relevant', () => {
		expect(touchesBehaviorMirror('app/web/src/routes/+page.svelte', join(FIXTURES, 'clean'))).toBe(false);
	});

	it('falls back to touchesContracts alone without throwing when there is no active profile', () => {
		// app/api/** is already contract-relevant per touchesContracts's own CONTRACT_PATTERNS,
		// so this stays true regardless of whether a profile resolves — the fallback's job is
		// just to not throw when moduleManifest/readProfile can't resolve anything, not to flip
		// this particular path to false.
		expect(
			touchesBehaviorMirror('app/api/tests/behaviors/widgets.mirror.ts', join(FIXTURES, 'no-product'))
		).toBe(true);
		expect(touchesBehaviorMirror('project/docs/behaviors/widgets.feature', join(FIXTURES, 'no-product'))).toBe(
			true
		);
		expect(touchesBehaviorMirror('app/web/src/routes/+page.svelte', join(FIXTURES, 'no-product'))).toBe(false);
	});
});

describe('gate-behavior-mirror CLI (PR mode, fail-closed)', () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'gate-behavior-mirror-'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	function run(args: string[] = [], env: Record<string, string> = {}) {
		const r = spawnSync(process.execPath, [GATE, ...args], {
			cwd: dir,
			encoding: 'utf8',
			env: { ...process.env, FILES: '', BASE_SHA: '', ...env }
		});
		return { code: r.status, output: `${r.stdout}${r.stderr}` };
	}

	it('does not apply when no changed file touches behavior-mirror paths', () => {
		const { code, output } = run([], { FILES: 'app/web/src/routes/+page.svelte' });
		expect(code).toBe(0);
		expect(output).toContain("gate doesn't apply");
	});

	it('checks unconditionally when there is no file list, and right-sizes on the empty skeleton', () => {
		const { code, output } = run();
		expect(code).toBe(0);
		expect(output).toContain('unconditionally');
		expect(output).toMatch(/no active profile/i);
	});

	it('--print-test-command prints nothing (exit 0) with no active profile', () => {
		const { code, output } = run(['--print-test-command']);
		expect(code).toBe(0);
		expect(output.trim()).toBe('');
	});
});

describe('gate-behavior-mirror CLI against the fixture trees', () => {
	function run(fixture: string, args: string[] = []) {
		const r = spawnSync(process.execPath, [GATE, ...args], {
			cwd: join(FIXTURES, fixture),
			encoding: 'utf8',
			env: { ...process.env, FILES: '', BASE_SHA: '' }
		});
		return { code: r.status, output: `${r.stdout}${r.stderr}` };
	}

	it('exits 0 on the clean fixture', () => {
		const { code, output } = run('clean');
		expect(code).toBe(0);
		expect(output).toContain('complete');
	});

	it('exits 1 with an ::error:: on a violated fixture', () => {
		const { code, output } = run('violated-missing-mirror');
		expect(code).toBe(1);
		expect(output).toContain('::error::');
	});

	it('--print-test-command prints the resolved backend test command on the clean fixture', () => {
		const { code, output } = run('clean', ['--print-test-command']);
		expect(code).toBe(0);
		expect(output.trim()).toBe('echo demo-behaviors-test');
	});

	it('--print-test-command prints nothing when behaviors.applicable is false', () => {
		const { code, output } = run('no-behaviors', ['--print-test-command']);
		expect(code).toBe(0);
		expect(output.trim()).toBe('');
	});
});
