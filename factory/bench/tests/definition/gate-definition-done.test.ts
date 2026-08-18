import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runDefinitionDone } from '../../../../.github/scripts/gate-definition-done.mjs';

/**
 * Test of the "Definition Done" gate (R-INIT, plan §0.4.2) — `/fabric-init`'s own
 * pending-items source of truth. Exercised against the synthetic fixture trees in
 * `fixtures/` (the planted-violation tradition: one fixture, one violation, permanently
 * kept failing) and once against the real `factory/templates/examples/ledgerline/`
 * example, whose known partial coverage (DECISIONS.md D-009, R-SAMPLES) this gate is
 * expected to report honestly rather than paper over.
 */

const GATE = join(process.cwd(), '.github', 'scripts', 'gate-definition-done.mjs');
const FIXTURES = join(process.cwd(), 'factory', 'bench', 'tests', 'definition', 'fixtures');
const LEDGERLINE = join(process.cwd(), 'factory', 'templates', 'examples', 'ledgerline');

describe('runDefinitionDone against synthetic fixture trees', () => {
	it('passes fully on the clean fixture', () => {
		const r = runDefinitionDone(join(FIXTURES, 'clean'));
		expect(r.ok).toBe(true);
		expect(r.pendingItems).toEqual([]);
	});

	it('rejects a missing mockup file', () => {
		const r = runDefinitionDone(join(FIXTURES, 'violated-missing-mockup-state'));
		expect(r.ok).toBe(false);
		expect(r.pendingItems).toEqual([
			{ area: 'D5', message: 'Mockup `S-widgets.html` does not exist.', skill: '/design-mockups' }
		]);
	});

	it('rejects a removed mandatory scenario class, delegated from gate-contracts', () => {
		const r = runDefinitionDone(join(FIXTURES, 'violated-missing-scenario-class'));
		expect(r.ok).toBe(false);
		expect(r.pendingItems).toHaveLength(1);
		expect(r.pendingItems[0].area).toBe('DP-3');
		expect(r.pendingItems[0].message).toContain('@duplicate');
	});

	it('rejects an endpoint absent from every milestone, delegated from gate-contracts', () => {
		const r = runDefinitionDone(join(FIXTURES, 'violated-endpoint-without-milestone'));
		expect(r.ok).toBe(false);
		expect(r.pendingItems).toHaveLength(1);
		expect(r.pendingItems[0].area).toBe('DP-3');
	});

	it('rejects a regressed Status header with no matching waiver', () => {
		const r = runDefinitionDone(join(FIXTURES, 'violated-regressed-status'));
		expect(r.ok).toBe(false);
		expect(r.pendingItems).toHaveLength(1);
		expect(r.pendingItems[0]).toMatchObject({ area: 'D1', skill: '/define-product' });
		expect(r.pendingItems[0].message).toContain('Status: candidate');
	});

	it('rejects a waiver recorded without the owner\'s approval — the waiver does not count', () => {
		const r = runDefinitionDone(join(FIXTURES, 'violated-waiver-without-approval'));
		expect(r.ok).toBe(false);
		expect(r.pendingItems).toEqual([
			{ area: 'D5', message: 'Mockup `S-widgets.html` does not exist.', skill: '/design-mockups' }
		]);
	});
});

describe('gate-definition-done CLI', () => {
	it('exits 0 with a summary line on the clean fixture', () => {
		const r = spawnSync(process.execPath, [GATE], {
			cwd: join(FIXTURES, 'clean'),
			encoding: 'utf8'
		});
		expect(r.status).toBe(0);
		expect(r.stdout).toContain('Definition Done');
	});

	it('exits 1 with a pending-items table naming the fixing skill', () => {
		const r = spawnSync(process.execPath, [GATE], {
			cwd: join(FIXTURES, 'violated-missing-mockup-state'),
			encoding: 'utf8'
		});
		expect(r.status).toBe(1);
		expect(r.stdout).toContain('| Area | Pending | Skill |');
		expect(r.stdout).toContain('/design-mockups');
	});
});

describe('runDefinitionDone against the Ledgerline example (R-SAMPLES honesty)', () => {
	// factory/templates/examples/ledgerline/ ships its artifacts flat (a templates example,
	// not a live product) — this materializes each file at the canonical project/ path its
	// own template's "How to instantiate" header documents, then runs the real gate against
	// it. It deliberately does NOT fabricate an init.json or any file the example doesn't
	// carry: the point is to prove the gate reports Ledgerline's actual, known partial
	// coverage (definition-status.yaml's own "Honesty note") rather than a guessed list.
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'gate-definition-done-ledgerline-'));
		const docs = join(dir, 'project', 'docs');
		mkdirSync(join(docs, 'contracts'), { recursive: true });
		mkdirSync(join(docs, 'behaviors'), { recursive: true });
		mkdirSync(join(dir, 'project', 'design', 'mockups'), { recursive: true });
		mkdirSync(join(dir, 'project', 'state'), { recursive: true });

		for (const file of ['PRODUCT.md', 'SPEC.md', 'ARCHITECTURE.md', 'DATA-MODEL.md', 'nfr.md', 'MILESTONES.md', 'screens.yaml', 'milestones.yaml']) {
			cpSync(join(LEDGERLINE, file), join(docs, file));
		}
		cpSync(join(LEDGERLINE, 'openapi.yaml'), join(docs, 'contracts', 'openapi.yaml'));
		cpSync(join(LEDGERLINE, 'integrations.yaml'), join(docs, 'contracts', 'integrations.yaml'));
		cpSync(join(LEDGERLINE, 'billing-update-plan.feature'), join(docs, 'behaviors', 'billing-update-plan.feature'));
		cpSync(join(LEDGERLINE, 'definition-status.yaml'), join(dir, 'project', 'state', 'definition-status.yaml'));
		cpSync(join(LEDGERLINE, 'S-invoices.html'), join(dir, 'project', 'design', 'mockups', 'S-invoices.html'));
		cpSync(join(LEDGERLINE, 'S-invoices--empty.html'), join(dir, 'project', 'design', 'mockups', 'S-invoices--empty.html'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it('reports exactly the known, honest coverage gaps — never zero, never a surprise', () => {
		const r = runDefinitionDone(dir);
		expect(r.ok).toBe(false);

		// D0: the example carries no init.json — it's a templates example, not a live product.
		expect(r.pendingItems).toContainEqual({
			area: 'D0',
			message: '`project/state/init.json` does not exist.',
			skill: '/init'
		});

		// D4: DESIGN.md/tokens.css/DESIGN-DIGEST.md were never built for this example — waived
		// in definition-status.yaml with loose, multi-artifact prose that does not exactly
		// match the canonical `DESIGN.md` filename, so the gap still surfaces (by design: see
		// gate-definition-done.mjs's `isWaived`).
		expect(r.pendingItems).toContainEqual({
			area: 'D4',
			message: '`project/design/DESIGN.md` does not exist.',
			skill: '/design-foundation'
		});

		// D5: only S-invoices (default + empty) ships a mockup; the other four screens' default
		// states are missing, same loose-waiver-doesn't-match reasoning as D4.
		const missingMockups = ['S-invoice-editor.html', 'S-settings.html', 'S-billing.html', 'S-email-invoice-sent.html'];
		for (const file of missingMockups) {
			expect(r.pendingItems).toContainEqual({
				area: 'D5',
				message: `Mockup \`${file}\` does not exist.`,
				skill: '/design-mockups'
			});
		}

		// DP-3: SPEC.md promises behavior coverage for F-3 and F-5, but only F-5's
		// billing-update-plan.feature exists — every operationId without its own
		// `@endpoint:<id>` scenario surfaces, and I-payments is short three of its five
		// mandatory classes (only @duplicate and @external-failure are @integration-tagged;
		// @happy/@invalid/@unauthorized are tagged @endpoint-only on upgradeSubscription/
		// cancelSubscription, which does not count toward the INTEGRATION's own coverage).
		const endpointsWithoutScenario = [
			'listInvoices',
			'createInvoice',
			'getInvoice',
			'updateInvoice',
			'sendInvoice',
			'handlePaymentWebhook',
			'getAccountSettings',
			'updateAccountSettings',
			'getSubscription'
		];
		for (const id of endpointsWithoutScenario) {
			expect(r.pendingItems).toContainEqual({
				area: 'DP-3',
				message: `Endpoint \`${id}\` has no scenario tagged \`@endpoint:${id}\`.`,
				skill: '/define-spec'
			});
		}
		for (const cls of ['happy', 'invalid', 'unauthorized']) {
			expect(r.pendingItems).toContainEqual({
				area: 'DP-3',
				message: `Integration \`I-payments\` has no \`@integration:I-payments\` scenario tagged \`@${cls}\`.`,
				skill: '/define-spec'
			});
		}

		// Exactly these 18 — not a subset, not a superset. Screens/features -> milestone
		// coverage, endpoint/integration -> milestone coverage, and every stage's own
		// `status: approved` all genuinely pass: that's the honest part of "partial".
		expect(r.pendingItems).toHaveLength(18);
	});
});
