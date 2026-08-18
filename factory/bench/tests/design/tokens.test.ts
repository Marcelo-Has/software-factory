import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `app/web/src/lib/styles/tokens.css` is a TRANSCRIPTION of `project/design/DESIGN.md`, and
 * this test is what makes it a transcription instead of a second opinion.
 *
 * `DESIGN.md` is approved at a human Decision Gate (`factory/docs/AUTONOMY.md`), and changing
 * it afterward is a new Decision Gate. But the UI reads the CSS, not the markdown: without this
 * comparison, changing `--accent` in the CSS alone would go through as an ordinary PR, and the
 * approved contract would become documentation for something that isn't live. Same design as
 * the `gate-design-md.mjs` gate: either the two artifacts agree, or the job fails, with no
 * agent judgment involved.
 *
 * The comparison is by TABLE ROW: each CSS token has to appear on a `DESIGN.md` row that also
 * contains its value, normalized. Normalizing is what lets `0.25rem` compare against `4px`, and
 * `cubic-bezier(0.2, 0.7, 0.2, 1)` against `cubic-bezier(.2, .7, .2, 1)`, without loosening the
 * comparison — they are the SAME quantities written in each file's own convention.
 *
 * GUARDED FOR THE EMPTY SKELETON: this generic core ships with no `app/web/src/lib/styles/
 * tokens.css` and `project/design/DESIGN.md` still a template. The suite activates
 * automatically once both are real — same pattern `ci.yml` uses to gate product jobs on "does
 * `app/` have code".
 */

const CSS_PATH = 'app/web/src/lib/styles/tokens.css';
const DESIGN_PATH = 'project/design/DESIGN.md';
const ready = existsSync(CSS_PATH) && existsSync(DESIGN_PATH);

describe('tokens.css is a faithful transcription of DESIGN.md', () => {
	if (!ready) {
		// `describe.skipIf` still executes this callback body to collect its child tests —
		// only the `it()`s themselves get skipped — so the reads below have to be guarded
		// here rather than relied on to simply not run.
		it.skip('skipped: no app/web/src/lib/styles/tokens.css or project/design/DESIGN.md yet', () => {});
		return;
	}

	const CSS = readFileSync(CSS_PATH, 'utf8');
	const DESIGN = readFileSync(DESIGN_PATH, 'utf8');

	/** `--name: value;` from the `:root` block, in the order they appear. */
	function tokensOf(css: string): Map<string, string> {
		const tokens = new Map<string, string>();
		for (const [, name, value] of css.matchAll(/^\s*--([a-z0-9-]+)\s*:\s*([^;]+);/gim)) {
			tokens.set(name, value.trim());
		}
		return tokens;
	}

	/**
	 * Puts both files in the same convention: no space, lowercase, `rem` to `px`, decimal
	 * comma to dot, dropped leading zero. Nothing here erases information — only notation.
	 */
	function normalize(value: string): string {
		return value
			.toLowerCase()
			.replace(/(\d+(?:[.,]\d+)?)rem/g, (_, n) => `${Number(String(n).replace(',', '.')) * 16}px`)
			.replace(/(\d),(\d)/g, '$1.$2')
			.replace(/\b0\.(\d)/g, '.$1')
			.replace(/(\.\d*?)0+\b/g, '$1')
			.replace(/\s+/g, '')
			.replace(/['"]/g, '');
	}

	/**
	 * Tokens whose value does NOT live in a `DESIGN.md` table row, with where it does live.
	 * Declared one by one on purpose: a generic exception ("skip whatever isn't found") would
	 * turn this test into one that always passes. Adjust this map to the active `DESIGN.md`'s
	 * own prose sections when instantiating this test for a real product.
	 */
	const OUTSIDE_TABLE: Record<string, { section: string; find: string }> = {};

	/** The table row that declares the token — `| \`name\` | … |`. */
	function tokenRow(name: string): string | undefined {
		const target = name.replace(/^(leading)-/, 'text-');
		return DESIGN.split(/\r?\n/).find((line) =>
			new RegExp(`^\\|\\s*\`${target}\`\\s*\\|`).test(line.trim())
		);
	}

	it('declares tokens (the file is not empty or renamed by mistake)', () => {
		expect(tokensOf(CSS).size).toBeGreaterThan(0);
	});

	for (const [name, value] of tokensOf(CSS)) {
		it(`--${name} has the value DESIGN.md declares`, () => {
			const outside = OUTSIDE_TABLE[name];
			if (outside) {
				expect(normalize(DESIGN), `--${name} should come from ${outside.section} of DESIGN.md`).toContain(
					normalize(outside.find)
				);
				return;
			}

			const row = tokenRow(name);
			expect(
				row,
				`--${name} has no matching row in DESIGN.md. A token outside the approved contract is ` +
					'a design decision made in silence: either it comes out of the CSS, or DESIGN.md ' +
					'changes through a Decision Gate.'
			).toBeDefined();

			expect(
				normalize(row as string),
				`--${name}: the CSS says \`${value}\` and the DESIGN.md row is \`${(row as string).trim()}\`.`
			).toContain(normalize(value));
		});
	}
});
