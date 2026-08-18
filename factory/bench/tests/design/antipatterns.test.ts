import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NOT_DETECTED, scan } from '../../../../.github/scripts/lint-antipatterns.mjs';

/**
 * The antipatterns lint against PLANTED VIOLATIONS — and against the detector list itself
 * going stale.
 *
 * Two jobs, and the second is the one that usually gets skipped:
 *
 * 1. **Rejects what it should, and only what it should.** Each fixture in
 *    `factory/bench/tests/design/fixtures/` plants one case; the violated/clean pair proves
 *    both the rejection AND the return to green. Without the second half, a detector that's
 *    too eager would go unnoticed — and a false positive in a deterministic gate is worse than
 *    no gate at all, because it teaches the factory to turn the gate off.
 *
 * 2. **The list doesn't go stale in silence.** `.claude/rules/design-antipatterns.md` marks
 *    items as `[LINT]`. Every item marked that way either becomes a detector, or is declared in
 *    `NOT_DETECTED` with the reason written down. Adding a new `[LINT]` to the rule without
 *    doing either REJECTS here — that's what stops the rule and the gate from silently
 *    diverging.
 */

const SCRIPT = join(process.cwd(), '.github', 'scripts', 'lint-antipatterns.mjs');
const FIXTURES = 'factory/bench/tests/design/fixtures';
const RULE = '.claude/rules/design-antipatterns.md';

function findingsFor(file: string) {
	const path = `${FIXTURES}/${file}`;
	return scan(path, readFileSync(path, 'utf8')) as {
		item: number;
		id: string;
		line: number;
	}[];
}

describe('planted violation rejects', () => {
	const findings = findingsFor('antipatterns-violated.svelte');
	const items = new Set(findings.map((f) => f.item));

	it.each([
		[60, 'lorem ipsum'],
		[26, 'purple gradient -> cyan'],
		[6, '`100vh` where `dvh` is correct'],
		[36, 'default browser font as the product voice'],
		[14, 'glassmorphism'],
		[15, 'multi-layer shadow'],
		[18, 'giant radius'],
		[27, 'gradient-filled text'],
		[28, 'pure black'],
		[47, 'overshoot easing'],
		[50, 'animating a layout property'],
		[52, 'custom cursor'],
		[55, '`outline: none` with no replacement'],
		[61, 'poetic placeholder'],
		[62, 'generic CTA'],
		[63, 'buzzword'],
		[64, 'generic sample data'],
		[65, 'generic step label'],
		[67, 'scroll hint'],
		[68, 'generic `alt`']
	])('catches antipattern %i (%s)', (item) => {
		expect(items).toContain(item);
	});
});

describe('returns to green, with no residual false positive', () => {
	it('the fixed version of the same screen passes clean', () => {
		expect(findingsFor('antipatterns-clean.svelte')).toEqual([]);
	});

	it('the live product passes its own gate', () => {
		const r = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
		expect(r.status, `${r.stdout || ''}${r.stderr || ''}`).toBe(0);
	});
});

describe('the justification is what opens the exception — and it has to say something', () => {
	it('`antipattern-ok: N -- reason` silences the finding', () => {
		expect(findingsFor('antipatterns-justified.svelte')).toEqual([]);
	});

	it('silencing with no reason is itself a finding', () => {
		const findings = findingsFor('antipatterns-empty-justification.svelte');
		expect(findings.map((f) => f.id)).toContain('empty-justification');
	});

	it('silencing that no longer silences anything is a finding (the residual false positive)', () => {
		const findings = findingsFor('antipatterns-useless-justification.svelte');
		expect(findings.map((f) => f.id)).toContain('useless-justification');
	});
});

describe('a comment is not the interface', () => {
	it('does not find an antipattern inside a comment that EXPLAINS the antipattern', () => {
		const source = [
			'<script>',
			'	// The preview used to use 100vh and broke with the in-app browser bar.',
			'</script>',
			'<style>',
			'	.a {',
			'		height: 100dvh;',
			'	}',
			'</style>'
		].join('\n');
		expect(scan('example.svelte', source)).toEqual([]);
	});
});

describe('the detector list keeps up with the rule', () => {
	const rule = readFileSync(RULE, 'utf8');
	const marked = [...rule.matchAll(/^(\d+)\.\s*\[LINT\]/gim)].map(([, n]) => Number(n));

	it('the rule has [LINT] items (the test is not reading the wrong file)', () => {
		expect(marked.length).toBeGreaterThan(20);
	});

	it('every [LINT] item in the rule either has a detector, or is declared without one with a reason', () => {
		const list = spawnSync(process.execPath, [SCRIPT, '--list'], { encoding: 'utf8' });
		const withDetector = new Set(
			list.stdout
				.split('\n')
				.map((l) => Number(l.trim().split(/\s+/)[0]))
				.filter((n) => Number.isInteger(n) && n > 0)
		);
		const declared = new Set(
			(NOT_DETECTED as { item: number; reason: string }[]).map((d) => d.item)
		);

		const orphans = marked.filter((n) => !withDetector.has(n) && !declared.has(n));
		expect(
			orphans,
			`[LINT] items in the rule with no detector and no declaration: ${orphans.join(', ')}. ` +
				'Either it becomes a detector in `.github/scripts/lint-antipatterns.mjs`, or it goes ' +
				'into `NOT_DETECTED` with the reason — the third option (silently left out) is how a ' +
				'gate stops covering what it claims to cover.'
		).toEqual([]);
	});

	it('every declaration with no detector carries a written reason', () => {
		for (const d of NOT_DETECTED as { item: number; reason: string }[]) {
			expect(d.reason.trim().length, `item ${d.item} has no reason`).toBeGreaterThan(40);
		}
	});
});
