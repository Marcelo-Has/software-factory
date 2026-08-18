import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../../../.github/scripts/ui-routes.mjs';

/**
 * The COVERAGE of the "required states" gate, which the gate itself can't check.
 *
 * A product's `e2e/design/states.spec.ts` proves the states exist and don't break **on the
 * components it exercises**. What it can't say is whether a component got left out: a
 * `describe` nobody wrote passes in silence, and the gate would stay green exactly by not
 * looking. This test closes that gap by reading the approved `project/design/DESIGN.md`'s
 * required-states table — the contract — and requiring every key component in it to be either
 * covered or declared as not having a screen yet.
 *
 * Same design as `antipatterns.test.ts` against its rule: the gate follows the contract,
 * instead of the two aging in different directions.
 *
 * GUARDED FOR THE EMPTY SKELETON: this generic core ships with `project/design/DESIGN.md` still
 * a template and no `app/web` yet, so there is no real states table and no real spec to compare.
 * The suite below activates automatically once both exist — same pattern `ci.yml` uses to gate
 * product jobs on "does `app/` have code".
 */

const DESIGN_PATH = 'project/design/DESIGN.md';
const SPEC_PATH = 'app/web/e2e/design/states.spec.ts';
const ready = existsSync(DESIGN_PATH) && existsSync(SPEC_PATH);

describe('required-states coverage (project/design/DESIGN.md)', () => {
	if (!ready) {
		// `describe.skipIf` still executes this callback body to collect its child tests —
		// only the `it()`s themselves get skipped — so the reads below have to be guarded
		// here rather than relied on to simply not run.
		it.skip('skipped: no project/design/DESIGN.md or app/web/e2e/design/states.spec.ts yet', () => {});
		return;
	}

	const DESIGN = readFileSync(DESIGN_PATH, 'utf8');
	const SPEC = readFileSync(SPEC_PATH, 'utf8');

	/**
	 * The four states this gate covers, and each one's column in the required-states table.
	 * `Offline / degraded` is left out: exercising it needs simulating a lost connection
	 * mid-upload, and what the contract promises there ("nothing typed is ever lost") is
	 * persistence behavior, already covered by a dedicated draft-persistence spec.
	 */
	const STATES: Record<string, number> = { empty: 2, loading: 3, error: 4, overflow: 5 };

	interface KeyComponent {
		name: string;
		/** Each state column's cell text, to know when the contract itself waives the state. */
		cells: string[];
	}

	/**
	 * The required-states table's key components: the first column, in bold. Anchored on the
	 * table's HEADER (`| Key component | Empty | …`), not a section number — renumbering
	 * `DESIGN.md` must not break this test silently.
	 */
	function keyComponents(): KeyComponent[] {
		const lines = DESIGN.split(/\r?\n/);
		const header = lines.findIndex((l) => /^\|\s*Key component\s*\|/.test(l.trim()));
		if (header === -1) throw new Error('Required-states table not found in DESIGN.md.');
		const found: KeyComponent[] = [];
		for (let i = header + 2; i < lines.length; i += 1) {
			const line = lines[i].trim();
			if (!line.startsWith('|')) break;
			const cells = line.split('|').map((c) => c.trim());
			const name = (cells[1] ?? '').replace(/\*\*/g, '').trim();
			if (name !== '') found.push({ name, cells });
		}
		return found;
	}

	/** The table waives a state when the cell itself says it doesn't apply. */
	const waived = (cell: string) => /not applicable/i.test(cell ?? '');

	/** What the spec declares as still without a screen. Read from the file, not copied. */
	function specPending(): string[] {
		const block = SPEC.match(/export const PENDING\s*=\s*\[([\s\S]*?)\]/);
		if (!block) throw new Error('`PENDING` not found in app/web/e2e/design/states.spec.ts.');
		return [...block[1].matchAll(/'([^']+)'/g)].map(([, name]) => name);
	}

	it('reads the DESIGN.md table (the test is not anchored in the wrong place)', () => {
		const components = keyComponents();
		expect(components.length).toBeGreaterThanOrEqual(4);
	});

	it('every key component is covered by the gate or declared as still without a screen', () => {
		const components = keyComponents();
		const pending = specPending();
		const uncovered = components
			.map((c) => c.name)
			.filter((name) => !SPEC.includes(`test.describe('${name}`) && !pending.includes(name));
		expect(
			uncovered,
			`Key components in DESIGN.md with no coverage and no declaration: ${uncovered.join(', ')}. ` +
				"Either they get a `test.describe` in app/web/e2e/design/states.spec.ts, or they go " +
				"into `PENDING` — antipattern 58 is exactly \"only the happy state implemented\"."
		).toEqual([]);
	});

	it('every component declared as pending truly has no route for it', () => {
		// The proof that `PENDING` hasn't become a hiding place: if the component gained a
		// screen, its name shows up as (or inside) a UI route slug, and the declaration has
		// stopped being true.
		for (const name of specPending()) {
			const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
			const matches = ROUTES.some((route) => route.toLowerCase().replace(/^\/+|\/+$/g, '').includes(slug));
			expect(
				matches,
				`"${name}" is declared as having no screen, but a UI route suggests otherwise ` +
					`(${ROUTES.join(', ')}). Update \`PENDING\` and write the coverage.`
			).toBe(false);
		}
	});

	it('every covered component exercises every state the table does not waive', () => {
		const components = keyComponents();
		const pending = specPending();
		for (const { name, cells } of components) {
			if (pending.includes(name)) continue;
			const start = SPEC.indexOf(`test.describe('${name}`);
			const next = SPEC.indexOf('test.describe(', start + 1);
			const block = SPEC.slice(start, next === -1 ? undefined : next);
			for (const [state, column] of Object.entries(STATES)) {
				if (waived(cells[column])) continue;
				expect(
					block.includes(`test('${state}:`),
					`"${name}" does not exercise the \`${state}\` state — the contract requires it (its ` +
						'cell does not say "not applicable"), and antipattern 58 is exactly the incomplete list.'
				).toBe(true);
			}
		}
	});
});
