#!/usr/bin/env node
/**
 * Waits for the `Screenshots` workflow run of the SAME commit and returns its `run_id`.
 *
 * WHY WAIT, INSTEAD OF REACTING TO `workflow_run`. The visual evidence is another workflow's
 * artifact, and the obvious way to grab it would be to trigger the critic on
 * `workflow_run: [Screenshots]`, with the `run_id` already in hand. That's rejected: a
 * `workflow_run` check does NOT enter the PR's check list — `verdict.yml` runs that way, and
 * there it's acceptable because its verdict is a convenience. Not here: `design-critic` is
 * one of the factory's quality gates, and a gate whose red doesn't block merge isn't a gate.
 * So the critic triggers on `pull_request`, like `review.yml`, and pays the price of
 * waiting — which is this script.
 *
 * FAIL-CLOSED, same argument as `preview-url.mjs`: timeout without a completed run, EXIT 1.
 * There is no "proceed without evidence" mode.
 *
 * What this script does NOT do: judge whether the evidence is complete. It finds the run;
 * `check-visual-evidence.mjs` checks the files, after download. A run that ended in `failure`
 * is still returned — `screenshots.yml` uploads whatever it captured with `!cancelled()`, and
 * a partial capture is diagnostic material. What fails the gate is a missing file, not the
 * neighboring run's status.
 *
 * Inputs, all by environment:
 *   GITHUB_TOKEN       runner token (`secrets.GITHUB_TOKEN`), with `actions: read`.
 *   GITHUB_REPOSITORY  `owner/repo`.
 *   SHA                the PR's head (`pull_request.head.sha`). For a `pull_request` run, the
 *                       run's `head_sha` is the branch head, not the merge commit — so
 *                       filtering by `head_sha` matches directly.
 *   WORKFLOW           workflow file to wait for (default `screenshots.yml`).
 *   TIMEOUT_SECONDS    wait ceiling (default 1200) · INTERVAL_SECONDS between attempts (15).
 *
 * The ceiling is 1200s and not 900s because `screenshots.yml` already waits up to 900s just
 * for the deploy preview, then still installs a browser and captures every route.
 *
 * Output: the id on `stdout` and, if `GITHUB_OUTPUT` exists, `run_id=<id>` and
 * `conclusion=<c>` in it.
 */
import { appendFileSync } from 'node:fs';

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const REPO = (process.env.GITHUB_REPOSITORY || '').trim();
const TOKEN = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
const SHA = (process.env.SHA || '').trim();
const WORKFLOW = (process.env.WORKFLOW || 'screenshots.yml').trim();
const TIMEOUT = Number(process.env.TIMEOUT_SECONDS || 1200) * 1000;
const INTERVAL = Number(process.env.INTERVAL_SECONDS || 15) * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * The run that matters, among what the API returned: the exact commit's, newest first.
 * Re-running the same run keeps its `id` and bumps `run_attempt`; a new push creates a
 * bigger `run_number`. Sorting by both, in this order, always picks the newest attempt of
 * the right commit.
 */
function pickRun(runs, sha) {
	const ofCommit = (runs || []).filter((r) => r && r.head_sha === sha);
	if (ofCommit.length === 0) return null;
	return ofCommit.sort(
		(a, b) => (b.run_number || 0) - (a.run_number || 0) || (b.run_attempt || 0) - (a.run_attempt || 0)
	)[0];
}

async function api(path) {
	const response = await fetch(`${API}${path}`, {
		headers: {
			accept: 'application/vnd.github+json',
			'x-github-api-version': '2022-11-28',
			...(TOKEN === '' ? {} : { authorization: `Bearer ${TOKEN}` })
		},
		// A per-request ceiling, not just the loop's global one: `fetch` without a signal waits
		// forever, and a hung connection would blow the JOB's timeout instead of this script's —
		// i.e. fail-closed would turn into a stuck job, which is worse than red. The error here
		// falls into the loop's `catch`, becomes a `::warning::`, and the next attempt proceeds.
		signal: AbortSignal.timeout(30_000)
	});
	if (!response.ok) {
		throw new Error(`GET ${path} responded ${response.status}`);
	}
	return response.json();
}

async function findRun() {
	const { workflow_runs: runs = [] } = await api(
		`/repos/${REPO}/actions/workflows/${encodeURIComponent(WORKFLOW)}/runs` +
			`?head_sha=${encodeURIComponent(SHA)}&per_page=20`
	);
	return pickRun(runs, SHA);
}

async function main() {
	if (REPO === '' || SHA === '') {
		console.log(
			'::error::`GITHUB_REPOSITORY` and `SHA` are required to find the visual-evidence run of ' +
				`\`${WORKFLOW}\`.`
		);
		return 1;
	}

	const deadline = Date.now() + TIMEOUT;
	let attempts = 0;
	while (Date.now() < deadline) {
		attempts += 1;
		let run = null;
		try {
			run = await findRun();
		} catch (error) {
			console.log(`::warning::Failed to query \`${WORKFLOW}\` runs: ${error.message}`);
		}

		if (run !== null && run.status === 'completed') {
			// `skipped` is the only outcome this script treats as its own error, because the
			// cause is always the same and is a configuration one: the two workflows' `paths:`
			// filters diverged, and the capturer didn't run on a PR the critic ran on. Waiting
			// longer doesn't fix that.
			if (run.conclusion === 'skipped') {
				console.log(
					`::error::Run ${run.id} of \`${WORKFLOW}\` was SKIPPED on this commit, but ` +
						'`design-critic` ran. Both workflows\' `paths:` filters need to be identical — ' +
						'without a capture there is no evidence, and without evidence the critic rejects ' +
						'the PR outright. Align the `paths:` before re-running.'
				);
				return 1;
			}
			console.log(
				`Visual evidence ready: run ${run.id} of \`${WORKFLOW}\` ` +
					`(attempt ${run.run_attempt || 1}, conclusion \`${run.conclusion}\`).`
			);
			return publish(run);
		}

		const state = run === null ? 'not created yet' : `\`${run.status}\``;
		console.log(
			`Run of \`${WORKFLOW}\` for ${SHA.slice(0, 8)} ${state} ` +
				`(attempt ${attempts}); checking again in ${INTERVAL / 1000}s.`
		);
		await sleep(INTERVAL);
	}

	console.log(
		`::error::The run of \`${WORKFLOW}\` for ${SHA.slice(0, 8) || 'this commit'} did not complete ` +
			`within ${TIMEOUT / 1000}s. Without the screenshots there is nothing to critique, and ` +
			'`design-critic` rejects the PR outright. Check the `Screenshots` job for this PR — it ' +
			'waits on the deploy preview — before re-running this job.'
	);
	return 1;
}

function publish(run) {
	console.log(run.id);
	const out = process.env.GITHUB_OUTPUT;
	// Written from here, not with shell `>>`: same care as `preview-url.mjs` — a value coming
	// from the API never passes through `run:` interpolation.
	if (out) appendFileSync(out, `run_id=${run.id}\nconclusion=${run.conclusion}\n`);
	return 0;
}

process.exit(await main());
