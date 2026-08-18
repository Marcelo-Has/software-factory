import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkContracts, touchesContracts } from '../../../../.github/scripts/gate-contracts.mjs';

/**
 * Test of the DP-3 logical/integration coverage gate (DECISIONS.md D-007). Two halves:
 * the applicability/env-var CLI contract (mirrors `gate-design-md.mjs`'s own test, run as a
 * subprocess — the exit code is what matters, not a reimplementation of the rule) and the
 * full-coverage check itself (`checkContracts`, exercised directly against the synthetic
 * fixture trees in `fixtures/`, the planted-violation tradition).
 */

const GATE = join(process.cwd(), '.github', 'scripts', 'gate-contracts.mjs');
const FIXTURES = join(process.cwd(), 'factory', 'bench', 'tests', 'definition', 'fixtures');

describe('touchesContracts', () => {
	it.each([
		'app/api/src/orders.ts',
		'app/worker/src/reconcile.ts',
		'app/web/src/routes/webhooks/payments/+server.ts',
		'project/docs/contracts/openapi.yaml',
		'project/docs/behaviors/billing.feature',
		'project/docs/nfr.md'
	])('must treat %s as contract-relevant', (path) => {
		expect(touchesContracts(path)).toBe(true);
	});

	it.each(['app/web/src/routes/+page.svelte', 'project/docs/PRODUCT.md', 'README.md'])(
		'must not treat %s as contract-relevant',
		(path) => {
			expect(touchesContracts(path)).toBe(false);
		}
	);
});

describe('gate-contracts CLI (PR mode, fail-closed)', () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'gate-contracts-'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	function run(env: Record<string, string> = {}) {
		const r = spawnSync(process.execPath, [GATE], {
			cwd: dir,
			encoding: 'utf8',
			env: { ...process.env, FILES: '', BASE_SHA: '', ...env }
		});
		return { code: r.status, output: `${r.stdout}${r.stderr}` };
	}

	it('does not apply when no changed file touches contract paths', () => {
		const { code, output } = run({ FILES: 'app/web/src/routes/+page.svelte' });
		expect(code).toBe(0);
		expect(output).toContain("gate doesn't apply");
	});

	it('checks unconditionally when there is no file list (fail-closed)', () => {
		const { code, output } = run();
		expect(code).toBe(1);
		expect(output).toContain('unconditionally');
	});

	it('checks unconditionally when git cannot diff (fail-closed)', () => {
		const { code, output } = run({ BASE_SHA: '0000000000000000000000000000000000000000' });
		expect(code).toBe(1);
		expect(output).toContain('::warning::');
	});

	it('always checks in --definition mode, regardless of changed files', () => {
		const r = spawnSync(process.execPath, [GATE, '--definition'], {
			cwd: dir,
			encoding: 'utf8',
			env: { ...process.env, FILES: 'README.md', BASE_SHA: '' }
		});
		expect(r.status).toBe(1);
	});

	it('exits 0 on the empty project/ skeleton once the diff touches a contract path', () => {
		mkdirSync(join(dir, 'project', 'docs', 'contracts'), { recursive: true });
		writeFileSync(
			join(dir, 'project', 'docs', 'contracts', 'openapi.yaml'),
			'openapi: 3.1.0\ninfo:\n  title: T\n  version: 0.1.0\npaths: {}\n'
		);
		writeFileSync(join(dir, 'project', 'docs', 'contracts', 'integrations.yaml'), 'integrations: []\n');
		const { code, output } = run({ FILES: 'project/docs/nfr.md' });
		expect(code).toBe(0);
		expect(output).toContain('costs zero');
	});
});

describe('checkContracts against synthetic fixture trees', () => {
	it('passes fully on the clean fixture', () => {
		const r = checkContracts(join(FIXTURES, 'clean'));
		expect(r.ok).toBe(true);
		expect(r.findings).toEqual([]);
	});

	it('rejects the fixture with a removed mandatory scenario class', () => {
		const r = checkContracts(join(FIXTURES, 'violated-missing-scenario-class'));
		expect(r.ok).toBe(false);
		expect(r.findings).toHaveLength(1);
		expect(r.findings[0]).toMatchObject({
			code: 'integration-missing-class',
			skill: '/define-spec'
		});
		expect(r.findings[0].message).toContain('@duplicate');
	});

	it('rejects the fixture with an endpoint absent from every milestone', () => {
		const r = checkContracts(join(FIXTURES, 'violated-endpoint-without-milestone'));
		expect(r.ok).toBe(false);
		expect(r.findings).toEqual([
			{
				code: 'endpoint-missing-milestone',
				message: "Endpoint `handlePaymentWebhook` is not listed in any milestone's `endpoints[]`.",
				skill: '/plan-milestones'
			}
		]);
	});

	// Fixtures whose violation lives outside the DP-3 axis (mockups, Status headers, waivers)
	// must NOT trip this gate — that's gate-definition-done.mjs's job, never duplicated here.
	it.each(['violated-missing-mockup-state', 'violated-regressed-status', 'violated-waiver-without-approval'])(
		'ignores %s (not a DP-3 concern)',
		(name) => {
			expect(checkContracts(join(FIXTURES, name)).ok).toBe(true);
		}
	);
});

describe('checkContracts edge cases (built inline — awkward to express as a fixture tree)', () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'gate-contracts-edge-'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	function write(rel: string, content: string) {
		const path = join(dir, 'project', 'docs', ...rel.split('/'));
		mkdirSync(join(path, '..'), { recursive: true });
		writeFileSync(path, content);
	}

	it('right-sizes to zero cost with no endpoints and no integrations', () => {
		write('contracts/openapi.yaml', 'openapi: 3.1.0\ninfo:\n  title: T\n  version: 0.1.0\npaths: {}\n');
		write('contracts/integrations.yaml', 'integrations: []\n');
		const r = checkContracts(dir);
		expect(r.ok).toBe(true);
		expect(r.findings).toEqual([]);
	});

	it('rejects an operation with no operationId', () => {
		write(
			'contracts/openapi.yaml',
			'openapi: 3.1.0\ninfo:\n  title: T\n  version: 0.1.0\npaths:\n  /widgets:\n    get:\n      security: []\n      responses:\n        \'200\':\n          description: ok\n'
		);
		write('contracts/integrations.yaml', 'integrations: []\n');
		const r = checkContracts(dir);
		expect(r.ok).toBe(false);
		expect(r.findings.some((f) => f.code === 'operation-missing-id')).toBe(true);
	});

	it('rejects a scenario with neither @endpoint nor @integration', () => {
		write('contracts/openapi.yaml', 'openapi: 3.1.0\ninfo:\n  title: T\n  version: 0.1.0\npaths: {}\n');
		write('contracts/integrations.yaml', 'integrations: []\n');
		write(
			'behaviors/x.feature',
			'Feature: X\n\n  @scenario:orphan-tags @happy\n  Scenario: No endpoint or integration\n    Given a\n    When b\n    Then c\n'
		);
		const r = checkContracts(dir);
		expect(r.ok).toBe(false);
		expect(r.findings[0].code).toBe('scenario-malformed');
	});

	it('rejects a scenario with more than one class tag', () => {
		write(
			'contracts/openapi.yaml',
			'openapi: 3.1.0\ninfo:\n  title: T\n  version: 0.1.0\npaths:\n  /w:\n    get:\n      operationId: getW\n      security: []\n      responses:\n        \'200\':\n          description: ok\n'
		);
		write('contracts/integrations.yaml', 'integrations: []\n');
		write(
			'behaviors/x.feature',
			'Feature: X\n\n  @scenario:two-classes @endpoint:getW @happy @invalid\n  Scenario: Two class tags\n    Given a\n    When b\n    Then c\n'
		);
		const r = checkContracts(dir);
		expect(r.ok).toBe(false);
		expect(r.findings.some((f) => f.code === 'scenario-malformed')).toBe(true);
	});

	it('rejects an orphan @endpoint tag', () => {
		write('contracts/openapi.yaml', 'openapi: 3.1.0\ninfo:\n  title: T\n  version: 0.1.0\npaths: {}\n');
		write('contracts/integrations.yaml', 'integrations: []\n');
		write(
			'behaviors/x.feature',
			'Feature: X\n\n  @scenario:orphan @endpoint:doesNotExist @happy\n  Scenario: Orphan\n    Given a\n    When b\n    Then c\n'
		);
		const r = checkContracts(dir);
		expect(r.ok).toBe(false);
		expect(r.findings[0]).toMatchObject({ code: 'scenario-orphan' });
	});

	it('rejects nfr.md missing while the product has its own endpoints', () => {
		write(
			'contracts/openapi.yaml',
			'openapi: 3.1.0\ninfo:\n  title: T\n  version: 0.1.0\npaths:\n  /w:\n    get:\n      operationId: getW\n      security: []\n      responses:\n        \'200\':\n          description: ok\n'
		);
		write('contracts/integrations.yaml', 'integrations: []\n');
		write('behaviors/x.feature', 'Feature: X\n\n  @scenario:w @endpoint:getW @happy\n  Scenario: W\n    Given a\n    When b\n    Then c\n');
		const r = checkContracts(dir);
		expect(r.findings.some((f) => f.code === 'nfr-missing')).toBe(true);
	});
});
