import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { merge, splitParts } from '../../../../.github/scripts/merge-critic-passes.mjs';

/**
 * The `design-critic`'s two passes (the dual-pass verdict guard-rail — see
 * `factory/docs/FACTORY.md`, GR-5).
 *
 * Two behaviors decide, on their own, whether a UI PR passes, and neither is verifiable by
 * reading the YAML:
 *
 * 1. **The two prompts have to be IDENTICAL.** The extra coverage the dual-pass design buys
 *    comes from sampling — two independent runs against the same criterion. If the prompts
 *    diverge, the union stops measuring coverage and starts measuring the difference between
 *    the two texts, and the gate silently becomes something else. Two copies of one contract
 *    drift apart in silence; this test is what makes that drift impossible.
 *
 * 2. **One rejection is enough.** It isn't a vote. A defect one pass sees and the other
 *    doesn't is, on the evidence that motivated this design, a real defect the other pass
 *    didn't happen to sample. Requiring consensus would throw away exactly the finding the
 *    second pass exists to catch.
 *
 * The prompts are EXTRACTED from the workflow, the same way
 * `factory/bench/tests/workflows/reentry.test.ts` extracts the re-entry filter: reimplementing
 * the rule in the test would only prove it can be written twice.
 */

const WORKFLOW = `${process.cwd()}/.github/workflows/design-critic.yml`;

/**
 * Extracts the `prompt: |` block belonging to one pass's MAIN step (not its F2 retry step —
 * the first `- name: 'Pass <label>` match is always the main one, since it's declared first).
 *
 * `\r\n` normalized before searching: with `core.autocrlf=true` (the case on Windows) the file
 * on disk has CRLF, and the anchors below end in `\n` — without this the extraction would fail
 * only outside CI, the worst kind of fragility.
 *
 * The block scalar's own indentation, not `claude_args:`, ends the extraction: a step's
 * mapping-level comments (same indent as its sibling keys) can sit between the block scalar and
 * `claude_args:`, and a plain `indexOf('claude_args:')` would swallow them into the "prompt" —
 * which is exactly wrong, since those comments are never sent to the agent.
 */
function passPrompt(label: 'A' | 'B'): string {
	const yaml = readFileSync(WORKFLOW, 'utf8').replace(/\r\n/g, '\n');
	const stepStart = yaml.indexOf(`- name: 'Pass ${label}`);
	if (stepStart === -1) {
		throw new Error(`Step "Pass ${label}" not found — the test is orphaned from the workflow.`);
	}
	const open = yaml.indexOf('prompt: |\n', stepStart);
	if (open === -1) {
		throw new Error(`Pass ${label}'s prompt not delimited — the test is orphaned from the workflow.`);
	}
	const rest = yaml.slice(open + 'prompt: |\n'.length);
	const lines = rest.split('\n');
	const firstContentLine = lines.find((l) => l.trim() !== '');
	if (firstContentLine === undefined) {
		throw new Error(`Pass ${label}'s prompt is empty — the test is orphaned from the workflow.`);
	}
	const blockIndent = firstContentLine.match(/^ */)?.[0].length ?? 0;
	const kept: string[] = [];
	for (const line of lines) {
		if (line.trim() === '') {
			kept.push('');
			continue;
		}
		const indent = line.match(/^ */)?.[0].length ?? 0;
		if (indent < blockIndent) break;
		kept.push(line);
	}
	return kept.join('\n').trimEnd();
}

describe('the two passes receive the SAME criterion', () => {
	it('the prompts are identical, aside from each one\'s own verdict file', () => {
		const a = passPrompt('A').replace(/design-critic-verdict-a\.md/g, '__VERDICT__');
		const b = passPrompt('B').replace(/design-critic-verdict-b\.md/g, '__VERDICT__');
		expect(b).toBe(a);
	});

	it('each pass writes to its own file', () => {
		expect(passPrompt('A')).toContain('design-critic-verdict-a.md');
		expect(passPrompt('B')).toContain('design-critic-verdict-b.md');
		// One writing over the other would silently erase the first sample.
		expect(passPrompt('A')).not.toContain('design-critic-verdict-b.md');
		expect(passPrompt('B')).not.toContain('design-critic-verdict-a.md');
	});
});

const APPROVE = (findings = '') =>
	`## design-critic — APPROVED\n\n${findings}\n### Anti-default test\n\nNo, it's specific.\n\nAPPROVED`;
const REJECT = (findings: string) =>
	`## design-critic — REJECTED\n\n${findings}\n### Anti-default test\n\nYes, it could have.\n\nREJECTED`;

describe('merging the passes — fail-closed, not a vote', () => {
	it('both approving, the verdict approves', () => {
		const out = merge([
			{ label: 'A', content: APPROVE() },
			{ label: 'B', content: APPROVE() }
		]);
		expect(out.split('\n').at(-1)).toBe('APPROVED');
	});

	it('ONE rejecting is enough to reject, and its finding survives', () => {
		// One run sees a defect, the other doesn't. It's still real, and diluting it by
		// majority would throw away exactly what the second pass exists to catch.
		const out = merge([
			{ label: 'A', content: APPROVE() },
			{
				label: 'B',
				content: REJECT('- [High] D1 · home@768 — one-word-per-line letter stack\n')
			}
		]);
		expect(out.split('\n').at(-1)).toBe('REJECTED');
		expect(out).toContain('one-word-per-line letter stack');
	});

	it('the merge preserves findings from BOTH passes', () => {
		const out = merge([
			{ label: 'A', content: REJECT('- [High] D1 · home@375 — A-only finding\n') },
			{ label: 'B', content: REJECT('- [Med] D3 · home@768 — B-only finding\n') }
		]);
		expect(out).toContain('A-only finding');
		expect(out).toContain('B-only finding');
	});

	it('with only one pass, warns that coverage dropped to one sample', () => {
		const out = merge([{ label: 'A', content: APPROVE() }]);
		expect(out).toMatch(/ONE sample/i);
		expect(out.split('\n').at(-1)).toBe('APPROVED');
	});

	it('a malformed verdict is REJECTED — readOutcome\'s fail-closed applies through the merge', () => {
		const out = merge([
			{ label: 'A', content: APPROVE() },
			{ label: 'B', content: 'text with no outcome on the last line' }
		]);
		expect(out.split('\n').at(-1)).toBe('REJECTED');
	});
});

describe('splitting one verdict into parts', () => {
	it('separates findings from the anti-default section, without swallowing the outcome', () => {
		const { findings, antiDefault } = splitParts(
			REJECT('- [High] D1 · home@375 — one\n- [Low] D2 · home@768 — two\n')
		);
		expect(findings).toHaveLength(2);
		expect(antiDefault).toBe("Yes, it could have.");
		expect(antiDefault).not.toContain('REJECTED');
	});

	it('handles a verdict with no findings at all', () => {
		expect(splitParts(APPROVE()).findings).toEqual([]);
	});
});

describe('neither pass wrote — the PR cannot go red AND MUTE', () => {
	it('writes an EXPLAINED rejection when there is no verdict at all', async () => {
		// A regression class: both passes get skipped by the workflow-self-modification
		// impasse (the AI action refuses to run on a PR that changes the workflow invoking
		// it), the final file ends up empty, and the job rejects with no line on the PR
		// thread explaining why.
		const { mkdtempSync, readFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const { execFileSync } = await import('node:child_process');

		const dir = mkdtempSync(join(tmpdir(), 'critic-'));
		const output = join(dir, 'verdict.md');
		try {
			execFileSync(
				process.execPath,
				[`${process.cwd()}/.github/scripts/merge-critic-passes.mjs`],
				{
					env: {
						...process.env,
						PASS_A: join(dir, 'does-not-exist-a.md'),
						PASS_B: join(dir, 'does-not-exist-b.md'),
						VERDICT_FILE: output
					},
					encoding: 'utf8'
				}
			);
			const content = readFileSync(output, 'utf8');
			expect(content.split('\n').at(-1)).toBe('REJECTED');
			expect(content).toMatch(/workflow-self-modification/i);
			expect(content).toMatch(/manual merge/i);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('does NOT overwrite the outright rejection for missing evidence', async () => {
		const { mkdtempSync, writeFileSync, readFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const { execFileSync } = await import('node:child_process');

		const dir = mkdtempSync(join(tmpdir(), 'critic-'));
		const output = join(dir, 'verdict.md');
		const outright = 'Missing screenshots: outright rejection.';
		writeFileSync(output, outright, 'utf8');
		try {
			execFileSync(
				process.execPath,
				[`${process.cwd()}/.github/scripts/merge-critic-passes.mjs`],
				{
					env: {
						...process.env,
						PASS_A: join(dir, 'does-not-exist-a.md'),
						PASS_B: join(dir, 'does-not-exist-b.md'),
						VERDICT_FILE: output
					},
					encoding: 'utf8'
				}
			);
			// Erasing the rejection reason would trade an explained red for a mute one.
			expect(readFileSync(output, 'utf8')).toBe(outright);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
