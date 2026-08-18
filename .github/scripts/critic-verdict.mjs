// No shebang, unlike its siblings in this folder: this module is IMPORTED by the harness
// tests, and vitest's transformer rejects `#!` after rewriting imports to CJS ("Invalid
// Character `!`"). It's never run as `./script.mjs` directly — it's always `node`, from the
// non-AI step of `design-critic.yml`.
/**
 * The close of `design-critic`: the verdict actually REJECTS, and visual iteration gets a
 * ceiling.
 *
 * TWO GAPS, AND THEY'RE THE SAME SHAPE.
 *
 * 1. **The gate didn't gate.** An earlier version of this critic wrote a verdict ending in
 *    `REJECTED` or `APPROVED` and a non-AI step published it as a comment. But that step only
 *    failed when the FILE was empty: a well-written `REJECTED` got posted to the PR and the
 *    job still finished **green**. The rubric and the anti-default test were, in practice,
 *    just a comment. This script reads the last line and makes the job go red.
 *
 * 2. **Iteration had no end.** The design gate calls for "ceiling of 3 rounds ->
 *    needs-human", and it didn't exist. Without a ceiling, a disagreement between the critic
 *    and the builder runs until the budget runs out — and the critic's round is the most
 *    expensive one in the factory (every route, every viewport, `fullPage`). The count lives
 *    in a **label on the PR itself** (`design:round-N`), the same shape as the re-entry
 *    counter's `reentry:N`: not in a log, not in a time window, and auditable on the board.
 *    Past the ceiling, `needs-human` goes on and **the disagreement becomes a human
 *    decision.** Stopping is a valid outcome.
 *
 * FAIL-CLOSED, and the edge case matters. Missing file, empty file, or anything that isn't
 * exactly `APPROVED` on the last line -> **rejected**, and it counts as a round. A critic
 * that stays silent when it doesn't know what to say only exists when it isn't needed — same
 * rule as `check-visual-evidence.mjs`, and that's why that script's own outright rejection
 * (which has no last line, because no critique ever happened) reads here as exactly what it
 * is: a rejection.
 *
 * THE ROUND IS DERIVED, NOT INCREMENTED.
 *
 * An incrementing counter has a defect that only shows up under real traffic: it measures
 * **job invocations**, not iterations. `design-critic.yml` listens to `synchronize` AND
 * `labeled` and has no `concurrency` group (a deliberate absence — a CANCELLED check run
 * blocks merge), so two runs can start from the same commit, in the same second, and each
 * would record its own round.
 *
 * And the defect is REFLEXIVE: the recovery command `gh pr edit --remove-label "a,b"` emits
 * TWO `unlabeled` events — clearing the ceiling would burn the ceiling, spending most of the
 * budget before the first fix session even runs.
 *
 * The fix isn't a lock or a `concurrency` group: it's making the count **idempotent**. The
 * round becomes the number of DISTINCT SHAs that have already received a verdict on this PR,
 * including the current one. Two runs over the same commit compute the same number, in any
 * order, without seeing each other — because both count a set, not increment a counter. The
 * ceiling goes back to measuring what it was meant to measure: **disagreement over reviewed
 * states**, not trigger arithmetic.
 *
 * The `design:round-N` label still exists, but becomes an auditable REFLECTION on the board,
 * not the source of truth — which is why `currentRound()` stays exported and the human
 * recovery command (removing the label) keeps working without changing the real count.
 *
 * Inputs, all by environment:
 *   VERDICT_FILE   path to the file the agent (or the evidence gate) wrote.
 *   PR             PR number. Without it the script judges and does NOT touch a label.
 *   SHA            commit under review. It's what makes the count idempotent; without it the
 *                  script falls back to the old increment (fail-open only for the COUNT,
 *                  never for the verdict).
 *   CEILING        rounds before `needs-human` (default 3).
 *   GH_TOKEN       runner token, for `gh`.
 *
 * Exit: 0 on `APPROVED`; 1 on anything else.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const FILE = (process.env.VERDICT_FILE || '').trim();
const PR = (process.env.PR || '').trim();
const SHA = (process.env.SHA || '').trim();
const CEILING = Number(process.env.CEILING || 3);

/** The prefix of the label that counts rounds. Mirrors the re-entry counter's `reentry:N`. */
export const ROUND_LABEL_PREFIX = 'design:round-';
export const NEEDS_HUMAN_LABEL = 'needs-human';

/**
 * The marker the publish step embeds (in an HTML comment, invisible in the rendered body) in
 * every published verdict. It's the memory of which commits have already been critiqued — and
 * the PR is the right place to keep it, same reasoning as the re-entry counter living in a
 * label: it stays on the object itself, is auditable by anyone looking at the PR, and doesn't
 * depend on a log or a time window.
 */
export const SHA_MARKER = 'design-critic:sha=';

/**
 * Reads the outcome from the verdict file.
 *
 * The contract with the agent (the `design-critic.yml` prompt) is: the LAST line, alone, is
 * `REJECTED` or `APPROVED`. Only `APPROVED` approves — anything else, including silence, is a
 * rejection with a stated reason.
 *
 * @param {string | undefined} content
 * @returns {{ approved: boolean, reason: string }}
 */
export function readOutcome(content) {
	if (typeof content !== 'string' || content.trim() === '') {
		return {
			approved: false,
			reason:
				'the verdict file is empty or missing: the visual critique did not happen. ' +
				'Treat as rejected, not as green.'
		};
	}
	const lines = content
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l !== '');
	const last = lines[lines.length - 1];
	if (last === 'APPROVED') return { approved: true, reason: 'verdict APPROVED.' };
	if (last === 'REJECTED') return { approved: false, reason: 'verdict REJECTED.' };
	return {
		approved: false,
		reason:
			`the verdict's last line is \`${last.slice(0, 80)}\`, and the contract requires ` +
			'`APPROVED` or `REJECTED` alone on the last line. Fail-closed: rejected. ' +
			'(This is also the format of the outright rejection for missing evidence.)'
	};
}

/**
 * The round already recorded in the PR's labels. No label at all -> zero.
 * @param {Array<string | { name?: string }> | undefined} labels
 * @returns {number}
 */
export function currentRound(labels) {
	return (labels || [])
		.map((l) => (typeof l === 'string' ? l : l?.name || ''))
		.filter((name) => name.startsWith(ROUND_LABEL_PREFIX))
		.map((name) => Number(name.slice(ROUND_LABEL_PREFIX.length)))
		.filter((n) => Number.isInteger(n) && n > 0)
		.reduce((max, n) => Math.max(max, n), 0);
}

/**
 * The commits that already received a verdict on this PR, read from `SHA_MARKER` in the
 * comments.
 *
 * Accepts short or full SHAs and lowercases them: what matters is the IDENTITY of the
 * reviewed state, and two runs of the same commit have to land in the same bucket.
 *
 * @param {Array<string | { body?: string }> | undefined} comments
 * @returns {Set<string>}
 */
export function criticizedShas(comments) {
	const found = new Set();
	const pattern = new RegExp(`${SHA_MARKER}([0-9a-fA-F]{7,40})`, 'g');
	for (const c of comments || []) {
		const body = typeof c === 'string' ? c : c?.body || '';
		for (const m of body.matchAll(pattern)) found.add(m[1].toLowerCase());
	}
	return found;
}

/**
 * What to do after a rejection: which label goes on, which comes off, and whether the ceiling
 * was hit.
 *
 * The round is **derived**: `|{already-criticized SHAs} ∪ {current SHA}|`. That's what makes
 * the operation idempotent — two concurrent runs over the same commit compute the same number
 * without seeing each other, because both count the same set. No lock needed, and the
 * workflow's deliberate lack of `concurrency` stops being a problem.
 *
 * Without `sha` — incomplete environment — this falls back to the old increment. It's
 * fail-open only on the COUNT, never on the verdict: a ceiling that overcounts wastes budget;
 * the REJECTED outcome was already decided before this calculation runs.
 *
 * The ceiling is compared against the NEW round: with `CEILING = 3`, the third rejection
 * already hands the PR to a human. Waiting for the fourth would mean paying for one more round
 * of the factory's most expensive job just to confirm what the third already said.
 *
 * @param {{ labels?: Array<string | { name?: string }>, comments?: Array<string | { body?: string }>, sha?: string, ceiling?: number }} [input]
 * @returns {{ current: number, next: number, add: string[], remove: string[], exceeded: boolean }}
 */
export function nextRound({ labels, comments, sha, ceiling = CEILING } = {}) {
	const current = currentRound(labels);
	const criticized = criticizedShas(comments);
	if (sha) criticized.add(String(sha).toLowerCase());
	const next = criticized.size > 0 ? criticized.size : current + 1;
	return {
		current,
		next,
		add: [`${ROUND_LABEL_PREFIX}${next}`, ...(next >= ceiling ? [NEEDS_HUMAN_LABEL] : [])],
		// Only drop the previous label when it's actually obsolete. Re-criticizing the SAME
		// commit keeps the same number, and in that case remove-then-re-add would produce two
		// label events for nothing — exactly the defect class this design closes.
		remove: current > 0 && current !== next ? [`${ROUND_LABEL_PREFIX}${current}`] : [],
		exceeded: next >= ceiling
	};
}

/**
 * @param {string[]} args
 * @param {{ tolerateFailure?: boolean }} [options]
 */
function gh(args, { tolerateFailure = false } = {}) {
	const r = spawnSync('gh', args, { encoding: 'utf8' });
	if (r.status !== 0 && !tolerateFailure) {
		throw new Error(`\`gh ${args.join(' ')}\` exited ${r.status}: ${(r.stderr || '').trim()}`);
	}
	return r;
}

/**
 * The PR's labels and comments, in one call. A network failure here can't turn into "round 1"
 * forever — hence the `throw`.
 *
 * The comments are the memory of which SHAs have already been criticized (`SHA_MARKER`), read
 * together with the labels on purpose: read at the same instant, so there's no window where
 * one is current and the other isn't.
 *
 * @param {string} number
 * @returns {{ labels: Array<{ name?: string }>, comments: Array<{ body?: string }> }}
 */
function prState(number) {
	const r = gh(['pr', 'view', number, '--json', 'labels,comments']);
	const data = JSON.parse(r.stdout || '{"labels":[],"comments":[]}');
	return { labels: data.labels || [], comments: data.comments || [] };
}

/**
 * `gh pr edit --add-label` fails if the label doesn't exist in the repository. Creating it is
 * idempotent.
 * @param {string} name
 * @param {string} color
 * @param {string} description
 */
function ensureLabel(name, color, description) {
	gh(['label', 'create', name, '--color', color, '--description', description], {
		tolerateFailure: true
	});
}

function main() {
	let content;
	try {
		content = readFileSync(FILE, 'utf8');
	} catch {
		// A missing file is the same case as an empty one: no critique happened. `readOutcome`
		// is the single place that turns this into a rejection.
		content = '';
	}

	const outcome = readOutcome(content);

	if (outcome.approved) {
		console.log(`design-critic: APPROVED — ${outcome.reason}`);
		// The round is NOT reset on approval: the PR's history is what makes the ceiling
		// auditable, and a PR that needed two rounds to pass is information, not noise.
		return 0;
	}

	console.log(`::error::design-critic REJECTED this PR — ${outcome.reason}`);

	if (PR === '') {
		console.log(
			'::warning::No `PR` in the environment: the round was not counted and no label was ' +
				'applied. The round ceiling depends on it.'
		);
		return 1;
	}

	try {
		const { labels, comments } = prState(PR);
		const step = nextRound({ labels, comments, sha: SHA });
		if (!SHA) {
			console.log(
				'::warning::No `SHA` in the environment: the round was counted by increment, not by ' +
					'distinct commit. Two runs of the same commit will count two rounds again.'
			);
		}
		ensureLabel(
			`${ROUND_LABEL_PREFIX}${step.next}`,
			'C5DEF5',
			'Visual-iteration round of design-critic'
		);
		if (step.remove.length > 0) {
			gh(['pr', 'edit', PR, '--remove-label', step.remove.join(',')], { tolerateFailure: true });
		}
		if (step.exceeded) {
			ensureLabel(NEEDS_HUMAN_LABEL, 'D93F0B', 'Needs a human decision — out of the automatic queue');
		}
		gh(['pr', 'edit', PR, '--add-label', step.add.join(',')]);

		if (step.exceeded) {
			console.log(
				`::error::Ceiling of ${CEILING} visual-iteration rounds reached on PR #${PR}. ` +
					`Applied the \`${NEEDS_HUMAN_LABEL}\` label: the PR leaves the automatic queue and the ` +
					'disagreement between the critic and the builder becomes a human decision. If three ' +
					'rounds weren\'t enough, the problem isn\'t the next round.'
			);
		} else {
			console.log(
				`Round ${step.next} of ${CEILING} recorded on PR #${PR} ` +
					`(label \`${ROUND_LABEL_PREFIX}${step.next}\`).`
			);
		}
	} catch (error) {
		console.log(
			`::error::Could not record the round on PR #${PR}: ${error instanceof Error ? error.message : error}. ` +
				'The verdict still stands — the job stays red.'
		);
	}

	return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	process.exit(main());
}
