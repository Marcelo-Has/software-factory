/**
 * Merges the `design-critic`'s two independent passes into one verdict (the F2/dual-pass
 * guard-rail — see `factory/docs/FACTORY.md`, GR-5).
 *
 * WHY TWO PASSES. Measuring several pairs of twin critic runs — same commit, same instant,
 * identical pipeline — showed the verdicts diverging, and the divergence wasn't about
 * severity: it was about PERCEPTION. One run described a specific defect the other never
 * mentioned. Both were right about what they saw. A real, high-severity defect can survive
 * many rounds by simply never landing in a single pass's sample.
 *
 * The conclusion: the critic **samples** the contract — each pass covers a subset, and the
 * subset changes. That isn't fixed by a stricter judge — a better model with a single pass is
 * still a sample. What the measurement showed is that the UNION of two passes was, every
 * time, more complete than any single run.
 *
 * THE CLOSING RULE IS FAIL-CLOSED, and that's the point: **one pass rejecting is enough for
 * the verdict to be REJECTED.** It isn't a vote. A defect one pass sees and the other doesn't
 * is, on this evidence, a real defect the other pass didn't happen to sample — not a false
 * positive to be diluted by majority. Requiring consensus would throw away exactly what the
 * second pass exists to catch.
 *
 * TOLERANT OF A MISSING PASS. If only one pass wrote, it stands alone (with a warning in the
 * body): a lost pass can't cost both. If NEITHER wrote, this script does NOT touch the
 * verdict file — because in that case whoever wrote it was `check-visual-evidence.mjs`, with
 * its own outright rejection for missing evidence, and overwriting it would erase the reason.
 *
 * Inputs, all by environment:
 *   PASS_A / PASS_B   files written by each pass.
 *   VERDICT_FILE      final file, consumed by the publish step and the round counter.
 *
 * Exit: always 0. `critic-verdict.mjs` is the single place that turns the outcome red.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readOutcome } from './critic-verdict.mjs';

const A = (process.env.PASS_A || '').trim();
const B = (process.env.PASS_B || '').trim();
const OUTPUT = (process.env.VERDICT_FILE || '').trim();

/** A finding is a line shaped `- [High|Med|Low] D<n> · <route>@<viewport> — ...`. */
const FINDING = /^-\s*\[(High|Med|Low)\]/i;
const ANTI_DEFAULT_TITLE = '### Anti-default test';

/**
 * Splits one pass's verdict into the parts the union needs.
 *
 * Deliberately tolerant: the body comes from an agent and can vary in spacing or carry extra
 * text. What is NOT inferred is the outcome — that comes from `readOutcome`, which is
 * fail-closed.
 *
 * @param {string} content
 * @returns {{ findings: string[], antiDefault: string }}
 */
export function splitParts(content) {
	const lines = (content || '').split(/\r?\n/);
	const findings = [];
	const antiDefault = [];
	let insideAntiDefault = false;

	for (const line of lines) {
		if (line.trim().toLowerCase().startsWith(ANTI_DEFAULT_TITLE.toLowerCase())) {
			insideAntiDefault = true;
			continue;
		}
		if (insideAntiDefault) {
			// The last standalone line is the outcome, not part of the section.
			if (/^(APPROVED|REJECTED)$/.test(line.trim())) continue;
			antiDefault.push(line);
			continue;
		}
		if (FINDING.test(line.trim())) findings.push(line.trim());
	}

	return { findings, antiDefault: antiDefault.join('\n').trim() };
}

/**
 * Builds the unified verdict. Exported so the test can assemble the body without touching disk.
 *
 * @param {{ label: string, content: string }[]} passes — only the ones that actually wrote.
 * @returns {string}
 */
export function merge(passes) {
	const read = passes.map((p) => ({
		...p,
		outcome: readOutcome(p.content),
		parts: splitParts(p.content)
	}));

	// Fail-closed: one rejection is enough. See the header — this isn't a vote.
	const approved = read.every((p) => p.outcome.approved);
	const outcome = approved ? 'APPROVED' : 'REJECTED';

	const out = [`## design-critic — ${outcome}`, ''];

	if (read.length === 1) {
		out.push(
			`> [!WARNING]`,
			`> Only **pass ${read[0].label}** produced a verdict. The other didn't write a file —`,
			`> this round's coverage is ONE sample, not the union of two.`,
			''
		);
	}

	for (const p of read) {
		out.push(`**Pass ${p.label}** — ${p.parts.findings.length} finding(s), ${p.outcome.approved ? 'APPROVED' : 'REJECTED'}`);
		out.push('');
		if (p.parts.findings.length === 0) out.push('- (no findings)');
		else out.push(...p.parts.findings);
		out.push('');
	}

	out.push(
		'> The two passes are independent and receive the SAME prompt. A finding that shows up in',
		'> one and not the other is not noise: the critic samples the contract, and the union',
		'> covers more than any single pass. **One rejection is enough to reject.**',
		''
	);

	for (const p of read) {
		if (!p.parts.antiDefault) continue;
		out.push(`${ANTI_DEFAULT_TITLE} — pass ${p.label}`, '', p.parts.antiDefault, '');
	}

	// The LAST line, alone: it's the contract `critic-verdict.mjs` reads.
	out.push(outcome);
	return out.join('\n');
}

/** @param {string} path */
function readIfExists(path) {
	if (!path) return '';
	try {
		return readFileSync(path, 'utf8');
	} catch {
		return '';
	}
}

function main() {
	const passes = [
		{ label: 'A', content: readIfExists(A) },
		{ label: 'B', content: readIfExists(B) }
	].filter((p) => p.content.trim() !== '');

	if (passes.length === 0) {
		// Neither pass wrote. Two cases, and the output file distinguishes them.
		if (readIfExists(OUTPUT).trim() !== '') {
			// A verdict already exists: it's the outright rejection for missing evidence.
			// Overwriting it would erase the reason for the rejection.
			console.log(
				'::warning::Neither pass wrote a verdict. Preserving the existing file ' +
					'(outright rejection). `critic-verdict.mjs` decides the outcome.'
			);
			return 0;
		}

		// Nothing written by either pass. The job rejects regardless (fail-closed), but
		// rejecting IN SILENCE is the factory's worst failure mode — a gate sitting "red and
		// MUTE" on every UI PR, with nothing in the thread explaining why. So the reason is
		// written here.
		//
		// The most likely cause is the workflow-self-modification impasse: the AI action
		// refuses to run when the PR changes the workflow that invokes it. In that case red is
		// EXPECTED, has no fix on the branch, and the outcome is a manual merge.
		writeFileSync(
			OUTPUT,
			[
				'## design-critic — REJECTED',
				'',
				'> [!WARNING]',
				'> **Neither pass produced a verdict.** The visual critique did not happen —',
				'> by fail-closed design this is a rejection, not an approval.',
				'',
				'Known causes, in order of likelihood:',
				'',
				'1. **Workflow-self-modification impasse** — this PR changes a workflow, and the AI',
				'   action refuses to run on a PR that changes the workflow invoking it. This is the',
				'   expected case for a factory-internal PR: red **has no fix on the branch**, and the',
				'   outcome is a **manual merge**. Check the `Pass A`/`Pass B` step logs for',
				'   `Workflow validation failed`.',
				'2. Both passes exhausted their turn budget without writing the file.',
				'3. Infrastructure failure in both agent steps.',
				'',
				'REJECTED'
			].join('\n'),
			'utf8'
		);
		console.log(
			'::warning::No pass wrote and there was no outright verdict already. Wrote an ' +
				'EXPLAINED rejection — the PR goes red with the reason in the thread, never red and mute.'
		);
		return 0;
	}

	if (passes.length === 1) {
		console.log(
			`::warning::Only pass ${passes[0].label} wrote a verdict — this round has ONE sample, ` +
				'not two. Coverage drops to that of a single isolated run.'
		);
	}

	writeFileSync(OUTPUT, merge(passes), 'utf8');
	console.log(`Unified verdict written to ${OUTPUT} from ${passes.length} pass(es).`);
	return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	process.exit(main());
}
