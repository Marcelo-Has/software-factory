import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	NEEDS_HUMAN_LABEL,
	ROUND_LABEL_PREFIX,
	SHA_MARKER,
	criticizedShas,
	currentRound,
	nextRound,
	readOutcome
} from '../../../../.github/scripts/critic-verdict.mjs';

/** Fictional commit SHAs, in the shape GitHub delivers. */
const SHA_1 = '1111111111111111111111111111111111111111';
const SHA_2 = '2222222222222222222222222222222222222222';
const SHA_3 = '3333333333333333333333333333333333333333';

/** A verdict comment as the publish step writes it, with the marker at the end. */
const verdict = (sha: string) => ({
	body: `## design-critic — REJECTED\n\n- [High] D1 · home@375 — something\n\n<!-- ${SHA_MARKER}${sha} -->`
});

/**
 * The close of `design-critic`: the verdict genuinely rejecting, and a ceiling on visual
 * iteration.
 *
 * These two behaviors decide, on their own, whether a UI PR passes or stops, and neither is
 * verifiable by reading the YAML — they're a file-reading rule and label arithmetic. Same
 * argument as `factory/bench/tests/workflows/reentry.test.ts`, which extracts and runs the
 * re-entry filter instead of trusting an inspection of the workflow.
 */

const FIXTURES = 'factory/bench/tests/design/fixtures';
const read = (file: string) => readFileSync(`${FIXTURES}/${file}`, 'utf8');

describe('reading the outcome — fail-closed', () => {
	it('approves when the last line is exactly APPROVED', () => {
		expect(readOutcome(read('verdict-approved.md')).approved).toBe(true);
	});

	it('rejects when the last line is REJECTED', () => {
		expect(readOutcome(read('verdict-rejected.md')).approved).toBe(false);
	});

	it('rejects the outright rejection for missing evidence, which has no last line of its own', () => {
		// `check-visual-evidence.mjs` writes this file when screenshots are missing. It's a
		// rejection and has to be read as one, even without following the agent's format.
		const outcome = readOutcome(read('verdict-outright.md'));
		expect(outcome.approved).toBe(false);
		expect(outcome.reason).toMatch(/fail-closed/i);
	});

	it('rejects an empty or missing file — silence is not approval', () => {
		expect(readOutcome('').approved).toBe(false);
		expect(readOutcome(undefined).approved).toBe(false);
		expect(readOutcome('   \n\n').approved).toBe(false);
	});

	it('does not approve just because APPROVED appears in the middle of the text', () => {
		const almost = ['## design-critic — APPROVED', '', '- [High] D7 · home@1280 — generic.', ''];
		expect(readOutcome(almost.join('\n')).approved).toBe(false);
	});

	it('does not approve when the last line is APPROVED with clutter around it', () => {
		expect(readOutcome('...\n**APPROVED**\n').approved).toBe(false);
	});
});

describe('visual-iteration round ceiling', () => {
	it('counts zero when the PR has no round label yet', () => {
		expect(currentRound([{ name: 'area:frontend' }, { name: 'delivery:complete' }])).toBe(0);
	});

	it('counts the largest recorded round, and ignores a similar-looking label', () => {
		expect(
			currentRound([
				{ name: `${ROUND_LABEL_PREFIX}1` },
				{ name: `${ROUND_LABEL_PREFIX}2` },
				{ name: 'reentry:3' },
				{ name: `${ROUND_LABEL_PREFIX}abc` }
			])
		).toBe(2);
	});

	it('the first rejection records round 1 and does not call a human', () => {
		const step = nextRound({ labels: [], comments: [], sha: SHA_1, ceiling: 3 });
		expect(step.next).toBe(1);
		expect(step.add).toEqual([`${ROUND_LABEL_PREFIX}1`]);
		expect(step.remove).toEqual([]);
		expect(step.exceeded).toBe(false);
	});

	it('the second swaps the previous round label for the new one', () => {
		const step = nextRound({
			labels: [{ name: `${ROUND_LABEL_PREFIX}1` }],
			comments: [verdict(SHA_1)],
			sha: SHA_2,
			ceiling: 3
		});
		expect(step.next).toBe(2);
		expect(step.add).toEqual([`${ROUND_LABEL_PREFIX}2`]);
		expect(step.remove).toEqual([`${ROUND_LABEL_PREFIX}1`]);
		expect(step.exceeded).toBe(false);
	});

	it('the THIRD exceeds the ceiling and hands the PR to a human', () => {
		const step = nextRound({
			labels: [{ name: `${ROUND_LABEL_PREFIX}2` }],
			comments: [verdict(SHA_1), verdict(SHA_2)],
			sha: SHA_3,
			ceiling: 3
		});
		expect(step.next).toBe(3);
		expect(step.exceeded).toBe(true);
		expect(step.add).toEqual([`${ROUND_LABEL_PREFIX}3`, NEEDS_HUMAN_LABEL]);
	});

	it('keeps handing it to a human if it runs again after the ceiling', () => {
		// It doesn't "un-exceed": a PR that went back into the queue after a human and
		// rejected again stays out of the automatic queue. The alternative would return the
		// disagreement to the loop that already failed three times.
		const step = nextRound({
			labels: [{ name: `${ROUND_LABEL_PREFIX}3` }],
			comments: [verdict(SHA_1), verdict(SHA_2), verdict(SHA_3)],
			sha: '4444444444444444444444444444444444444444',
			ceiling: 3
		});
		expect(step.add).toContain(NEEDS_HUMAN_LABEL);
	});
});

/**
 * The round is derived from the commit, not from the number of invocations.
 *
 * An earlier design measured JOB INVOCATIONS, not iterations: `design-critic.yml` listens to
 * `synchronize` and `labeled` with no `concurrency`, so two runs could start from the same
 * commit and each would record its own round. And it was reflexive: `gh pr edit
 * --remove-label "a,b"` emits TWO `unlabeled` events, so the human RECOVERY command would burn
 * 2/3 of the ceiling before the fix session even ran.
 *
 * These cases exist so the count never again depends on the order or the number of
 * invocations. None of them would pass against the earlier, incrementing design.
 */
describe('the round is derived from the commit, not from the number of invocations', () => {
	it('TWO runs of the SAME commit count ONE round', () => {
		const first = nextRound({ labels: [], comments: [], sha: SHA_1, ceiling: 3 });
		// The second run already sees the verdict the first one published.
		const second = nextRound({
			labels: [{ name: `${ROUND_LABEL_PREFIX}1` }],
			comments: [verdict(SHA_1)],
			sha: SHA_1,
			ceiling: 3
		});
		expect(first.next).toBe(1);
		expect(second.next).toBe(1);
		// And it doesn't swap the label for itself — two label events for nothing is exactly
		// the defect class this design closes.
		expect(second.remove).toEqual([]);
	});

	it('two SIMULTANEOUS runs of the same commit land on the same number', () => {
		// The real case: neither saw the other's comment. Because the count is a set, not an
		// increment, both compute the same value — no lock, no `concurrency`, any order.
		const input = { labels: [], comments: [], sha: SHA_1, ceiling: 3 };
		expect(nextRound(input).next).toBe(nextRound(input).next);
	});

	it('DIFFERENT commits count different rounds — the ceiling still exists', () => {
		expect(
			nextRound({ labels: [], comments: [verdict(SHA_1)], sha: SHA_2, ceiling: 3 }).next
		).toBe(2);
	});

	it('removing the round label does NOT change the real count', () => {
		// The human recovery command stops touching the ceiling: the truth is in the commits
		// already criticized, and the label is just an auditable reflection on the board.
		const noLabel = nextRound({
			labels: [],
			comments: [verdict(SHA_1), verdict(SHA_2)],
			sha: SHA_3,
			ceiling: 3
		});
		expect(noLabel.next).toBe(3);
		expect(noLabel.exceeded).toBe(true);
	});

	it('a short SHA and the full SHA of the same commit do not count twice', () => {
		const step = nextRound({
			labels: [],
			comments: [verdict(SHA_1.slice(0, 8))],
			sha: SHA_1.slice(0, 8),
			ceiling: 3
		});
		expect(step.next).toBe(1);
	});

	it('with no SHA in the environment, falls back to the old increment instead of jamming', () => {
		// Fail-open only on the COUNT: a ceiling that overcounts wastes budget, but the
		// REJECTED outcome was already decided before this calculation runs.
		expect(
			nextRound({ labels: [{ name: `${ROUND_LABEL_PREFIX}1` }], sha: '', ceiling: 3 }).next
		).toBe(2);
	});

	it('reads SHAs from real comments, ignoring text that is not a verdict', () => {
		const shas = criticizedShas([
			{ body: 'owner comment mentioning design-critic with no marker' },
			verdict(SHA_1),
			{ body: `blah blah <!-- ${SHA_MARKER}${SHA_2} --> blah` }
		]);
		expect([...shas].sort()).toEqual([SHA_1, SHA_2].sort());
	});
});
