#!/usr/bin/env node
/**
 * Discovers the deploy-preview URL for the commit under review, behind a neutral adapter
 * interface. **Netlify is the first (and, in this generic core, only) adapter.**
 *
 * Nothing here triggers a deploy: this script only WAITS for and READS what a deploy-preview
 * integration already publishes. The adapter interface is `findPreviewUrl(options)` below,
 * which polls a list of source lookups until one returns a validated URL; each source is a
 * plain `async ({ repo, sha, prNumber, token }) => url | null` function. Adding a second
 * provider means adding a new set of source functions and a new validator — the workflow
 * calling this script doesn't change.
 *
 * FAIL-CLOSED: once the timeout is exhausted with no valid URL, the script EXITS 1. There is
 * no "proceed without evidence" mode — a missing screenshot is exactly what rejects the PR
 * outright at the `design-critic` gate, and a resolver that stays quiet when it doesn't know
 * delivers a green that means nothing.
 *
 * Inputs, all by environment:
 *   PREVIEW_URL        shortcut: if set, it's validated and returned without calling any API.
 *   GITHUB_TOKEN       runner token (`secrets.GITHUB_TOKEN`), with `statuses: read` and
 *                       `pull-requests: read`.
 *   GITHUB_REPOSITORY  `owner/repo`.
 *   SHA                the commit the preview was built from (`pull_request.head.sha`).
 *   PR_NUMBER          PR number, for the bot-comment source.
 *   TIMEOUT_SECONDS    wait ceiling (default 900) · INTERVAL_SECONDS between attempts (15).
 *
 * Output: the URL on `stdout` and, if `GITHUB_OUTPUT` exists, `url=<URL>` in it.
 */
import { appendFileSync } from 'node:fs';

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const REPO = (process.env.GITHUB_REPOSITORY || '').trim();
const TOKEN = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
const SHA = (process.env.SHA || '').trim();
const PR = (process.env.PR_NUMBER || '').trim();
const TIMEOUT = Number(process.env.TIMEOUT_SECONDS || 900) * 1000;
const INTERVAL = Number(process.env.INTERVAL_SECONDS || 15) * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path) {
	const response = await fetch(`${API}${path}`, {
		headers: {
			accept: 'application/vnd.github+json',
			'x-github-api-version': '2022-11-28',
			...(TOKEN === '' ? {} : { authorization: `Bearer ${TOKEN}` })
		}
	});
	if (!response.ok) {
		throw new Error(`GET ${path} responded ${response.status}`);
	}
	return response.json();
}

// ---- adapter interface ----------------------------------------------------------------
//
// A preview-URL adapter is a validator plus an ordered list of source lookups. `findUrl`
// tries each source in order on every polling tick, validates whatever it finds, and
// live-probes the URL before accepting it — a URL existing isn't the same thing as the
// preview being up.

/**
 * @typedef {(ctx: { repo: string, sha: string, prNumber: string }) => Promise<string | null>} PreviewSource
 * @typedef {{ name: string, validate: (raw: string) => string | null, sources: { name: string, find: PreviewSource }[] }} PreviewAdapter
 */

/** Confirms the URL actually responds before we trust it. Retries — a fresh deploy can be slow to warm up. */
async function isLive(url) {
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const response = await fetch(url, { redirect: 'follow' });
			if (response.ok) return true;
			console.log(`${url} responded ${response.status} (attempt ${attempt}/3).`);
		} catch (error) {
			console.log(`${url} did not respond: ${error.message} (attempt ${attempt}/3).`);
		}
		if (attempt < 3) await sleep(10_000);
	}
	return false;
}

/**
 * Polls every source of the given adapter until a live, validated preview URL turns up.
 * @param {PreviewAdapter} adapter
 * @param {{ repo: string, sha: string, prNumber: string, timeoutMs: number, intervalMs: number }} options
 * @returns {Promise<string | null>}
 */
async function findPreviewUrl(adapter, { repo, sha, prNumber, timeoutMs, intervalMs }) {
	const deadline = Date.now() + timeoutMs;
	let attempts = 0;
	while (Date.now() < deadline) {
		attempts += 1;
		for (const source of adapter.sources) {
			let raw = null;
			try {
				raw = await source.find({ repo, sha, prNumber });
			} catch (error) {
				console.log(`::warning::Failed to read ${source.name}: ${error.message}`);
			}
			const validated = raw === null ? null : adapter.validate(raw);
			if (validated !== null) {
				console.log(`Deploy preview found via ${source.name}: ${validated}`);
				if (await isLive(validated)) return validated;
				console.log(`::warning::${validated} isn't up yet — still waiting.`);
			}
		}
		console.log(
			`Preview not published yet (attempt ${attempts}); checking again in ${intervalMs / 1000}s.`
		);
		await sleep(intervalMs);
	}
	return null;
}

// ---- Netlify adapter (first implementation) --------------------------------------------

/** `null` if not a deploy-preview URL. Only `https://*.netlify.app` is accepted — the Netlify
 * dashboard domain and anything else is rejected. Returns the ORIGIN: any path that comes
 * along with it belongs to the deploy dashboard, not the route to capture. */
function validateNetlifyUrl(raw) {
	if (typeof raw !== 'string' || raw.trim() === '') return null;
	let url;
	try {
		url = new URL(raw.trim());
	} catch {
		return null;
	}
	if (url.protocol !== 'https:') return null;
	if (!url.hostname.endsWith('.netlify.app')) return null;
	return url.origin;
}

/** Source 1: the commit status Netlify publishes on the PR's commit. */
async function fromCommitStatus({ repo, sha }) {
	if (repo === '' || sha === '') return null;
	const { statuses = [] } = await api(`/repos/${repo}/commits/${sha}/status`);
	const fromNetlify = statuses.filter(
		(s) => typeof s.context === 'string' && s.context.toLowerCase().includes('netlify')
	);
	for (const status of fromNetlify) {
		const validated = validateNetlifyUrl(status.target_url);
		if (validated !== null) return validated;
	}
	return null;
}

/** Source 2: the `netlify[bot]` comment on the PR. Most recent wins — it's the HEAD's deploy. */
async function fromBotComment({ repo, prNumber }) {
	if (repo === '' || prNumber === '') return null;
	const comments = await api(`/repos/${repo}/issues/${prNumber}/comments?per_page=100`);
	const fromBot = comments.filter((c) => c.user?.login === 'netlify[bot]');
	for (const comment of fromBot.reverse()) {
		const matches = String(comment.body || '').match(/https:\/\/[a-z0-9.-]+\.netlify\.app/gi) || [];
		// Prefer the `deploy-preview-<n>--<site>` permalink: it points at the PR's HEAD; the
		// comment also carries the specific deploy's URL, which works too but ages.
		const permalink = matches.filter((u) => u.includes('deploy-preview-'));
		for (const raw of [...permalink, ...matches]) {
			const validated = validateNetlifyUrl(raw);
			if (validated !== null) return validated;
		}
	}
	return null;
}

/** @type {PreviewAdapter} */
const netlifyAdapter = {
	name: 'netlify',
	validate: validateNetlifyUrl,
	sources: [
		{ name: 'commit status', find: fromCommitStatus },
		{ name: 'netlify[bot] comment', find: fromBotComment }
	]
};

// ---- entry point ------------------------------------------------------------------------

async function main() {
	const shortcut = validateNetlifyUrl(process.env.PREVIEW_URL || '');
	if (shortcut !== null) {
		console.log(`URL supplied via \`PREVIEW_URL\`: ${shortcut}`);
		return publish(shortcut);
	}

	const found = await findPreviewUrl(netlifyAdapter, {
		repo: REPO,
		sha: SHA,
		prNumber: PR,
		timeoutMs: TIMEOUT,
		intervalMs: INTERVAL
	});
	if (found !== null) return publish(found);

	console.log(
		`::error::Could not discover the ${netlifyAdapter.name} deploy-preview URL for ` +
			`${SHA.slice(0, 8) || 'this commit'} within ${TIMEOUT / 1000}s. Without a preview there ` +
			'is no screenshot, and without a screenshot there is no Visual Verification Loop ' +
			'evidence — `design-critic` rejects the PR outright. Check the PR\'s deploy preview ' +
			'before re-running this job.'
	);
	return 1;
}

function publish(url) {
	console.log(url);
	const out = process.env.GITHUB_OUTPUT;
	// Written from here, not with shell `>>`: the URL comes from outside the repository and
	// never passes through `run:` interpolation — the same care the rest of the factory takes
	// with third-party input.
	if (out) appendFileSync(out, `url=${url}\n`);
	return 0;
}

process.exit(await main());
