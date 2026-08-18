import { spawn, spawnSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Test of the Visual Verification Loop's evidence gate.
 *
 * Both scripts are ACTUALLY RUN, the same way `screenshots.test.ts` does with the capturer and
 * `design-md.test.ts` does with the `DESIGN.md` gate: what needs measuring is the **exit
 * code**, which is what goes red on the PR. Reimplementing the rule inside the test would only
 * prove it can be written twice.
 *
 * `await-screenshots.mjs` talks to the GitHub API, so the test starts a stub server and points
 * `GITHUB_API_URL` at it — that way the network path is exercised for real, including the
 * fail-closed timeout, with no dependency on the network or a credential.
 */

const CHECK = join(process.cwd(), '.github', 'scripts', 'check-visual-evidence.mjs');
const AWAIT = join(process.cwd(), '.github', 'scripts', 'await-screenshots.mjs');
const SHA = 'b57d75d8574b409860640197cf189b56a6a2ba6c';

function run(script: string, env: Record<string, string> = {}) {
	const r = spawnSync(process.execPath, [script], {
		encoding: 'utf8',
		env: { ...process.env, ...env }
	});
	return { code: r.status, output: `${r.stdout}${r.stderr}` };
}

/**
 * The async version, mandatory when the stub server lives IN THIS PROCESS: `spawnSync` blocks
 * the event loop, the server never gets to respond to the child, and the two hang waiting on
 * each other.
 */
function runAsync(script: string, env: Record<string, string> = {}) {
	return new Promise<{ code: number | null; output: string }>((resolve) => {
		const child = spawn(process.execPath, [script], { env: { ...process.env, ...env } });
		let output = '';
		child.stdout.on('data', (p) => (output += p));
		child.stderr.on('data', (p) => (output += p));
		child.on('close', (code) => resolve({ code, output }));
	});
}

/**
 * The expected list comes from `ui-routes.mjs` directly — the SAME single source
 * `check-visual-evidence.mjs` consults. Importing it here instead of spawning
 * `screenshots.mjs --list` avoids a needless dependency on `playwright-core` for a check that
 * needs no browser at all.
 */
async function expectedFiles(): Promise<string[]> {
	const { listFiles } = await import('../../../../.github/scripts/ui-routes.mjs');
	return listFiles();
}

/** A temp destination with the requested PNGs (any content — the gate checks presence and size). */
function destinationWith(files: string[]): string {
	const root = mkdtempSync(join(tmpdir(), 'evidence-'));
	for (const relative of files) {
		const path = join(root, relative);
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, 'png');
	}
	return root;
}

describe('check-visual-evidence — the last quality gate', () => {
	it('must exit 0 when the complete round is on disk', async () => {
		const expected = await expectedFiles();
		const { code, output } = run(CHECK, { DESTINATION: destinationWith(expected) });
		expect(code).toBe(0);
		expect(output).toContain(`${expected.length} screenshot(s)`);
	});

	it('must reject and name the file when ONE screenshot is missing', async () => {
		const expected = await expectedFiles();
		const missing = expected[0];
		const destination = destinationWith(expected.filter((a) => a !== missing));
		const { code, output } = run(CHECK, { DESTINATION: destination });
		expect(code).toBe(1);
		expect(output).toContain('::error::');
		expect(output).toContain(missing);
	});

	it('must reject when the PNG exists at 0 bytes — green with no content is not evidence', async () => {
		const expected = await expectedFiles();
		const destination = destinationWith(expected);
		writeFileSync(join(destination, expected[0]), '');
		const { code, output } = run(CHECK, { DESTINATION: destination });
		expect(code).toBe(1);
		expect(output).toContain(expected[0]);
	});

	it('must reject when there is no evidence at all', async () => {
		const expected = await expectedFiles();
		const { code, output } = run(CHECK, { DESTINATION: destinationWith([]) });
		expect(code).toBe(1);
		expect(output).toContain(`${expected.length} of ${expected.length} screenshot(s) missing`);
	});

	it('must write the outright rejection to the verdict file, for the non-AI step to publish', () => {
		const root = mkdtempSync(join(tmpdir(), 'verdict-'));
		const verdict = join(root, 'design-critic-verdict.md');
		const { code } = run(CHECK, {
			DESTINATION: destinationWith([]),
			VERDICT_FILE: verdict
		});
		expect(code).toBe(1);
		const text = readFileSync(verdict, 'utf8');
		expect(text).toContain('REJECTED');
		expect(text).toContain('outright');
		// Without this the PR would go red and mute: the guard-rail requires a non-empty file.
		expect(text.length).toBeGreaterThan(0);
	});
});

/**
 * This gate ran red and MUTE on every UI PR in the origin project until it was caught, and no
 * test noticed.
 *
 * `check-visual-evidence.mjs` used to get its expected list by running `screenshots.mjs
 * --list`, and the capturer imports `playwright-core` at the top of the module. The
 * `design-critic` job does NOT install dependencies — it downloads ready-made PNGs and calls an
 * agent, with no `npm ci` — so in CI that `--list` exited 1 with `ERR_MODULE_NOT_FOUND`, the
 * gate failed closed, no verdict was ever written, and the job was impossible to pass.
 *
 * The tests above didn't catch it because they run under vitest, **with `node_modules` on
 * disk**: the test environment had what the job's environment doesn't. Checking the exit code
 * wasn't enough — what's missing is checking the ENVIRONMENT PROPERTY: no script the job runs
 * without `npm ci` may depend on a `node_modules` package, through any path.
 *
 * TWO TESTS, and the first is the one that matters. A static check of the `import` graph alone
 * would NOT have caught the original bug: it entered through the capturer's `spawn`, not an
 * `import`, and no `import` reading reaches a child process. So the primary test EXECUTES the
 * scripts from a copy outside the repository tree, where Node's module resolution finds no
 * `node_modules` at all — reproducing the job's environment and covering both `import` and
 * `spawn` at once. The static check stays as a cheap complement, because it NAMES the guilty
 * package when it fails, and a gate that names the package costs less to fix.
 */
describe('design-critic scripts run without `npm ci`', () => {
	/** Scripts `design-critic.yml` runs with `node`, in a job that installs no dependencies. */
	const NO_INSTALL = [
		'check-visual-evidence.mjs',
		'critic-verdict.mjs',
		'await-screenshots.mjs'
	];

	/** The `import ... from '<x>'` / `export ... from '<x>'` specifiers of a file. */
	function importsOf(file: string): string[] {
		const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
		return [...text.matchAll(/^\s*(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]/gm)].map(
			(m) => m[1]
		);
	}

	/** Walks the graph from `entry`, following only relative specifiers, and collects the "bare" ones. */
	function packagesReached(entry: string): string[] {
		const seen = new Set<string>();
		const bare = new Set<string>();
		const queue = [entry];
		while (queue.length > 0) {
			const current = queue.pop() as string;
			if (seen.has(current)) continue;
			seen.add(current);
			for (const spec of importsOf(current)) {
				if (spec.startsWith('node:')) continue;
				if (spec.startsWith('.')) {
					queue.push(join(dirname(current), spec));
					continue;
				}
				bare.add(`${spec} (via ${current.split(/[\\/]/).pop()})`);
			}
		}
		return [...bare];
	}

	/**
	 * A copy of `.github/scripts/` in a temp directory OUTSIDE the repository tree. Node's
	 * module resolution walks up parent directories looking for `node_modules`; running from
	 * inside the repo would always find the project's own, and the test would pass without
	 * proving anything.
	 */
	function isolatedScripts(): string {
		const root = mkdtempSync(join(tmpdir(), 'no-node-modules-'));
		cpSync(join(process.cwd(), '.github', 'scripts'), join(root, 'scripts'), { recursive: true });
		return join(root, 'scripts');
	}

	it('check-visual-evidence must run in an environment with NO node_modules — that is the job\'s environment', async () => {
		// The happy case: complete evidence. If the script needs any package, by `import` or
		// by `spawn` of a sibling that imports one, it dies here instead of dying mute in CI.
		const destination = destinationWith(await expectedFiles());
		const { code, output } = run(join(isolatedScripts(), 'check-visual-evidence.mjs'), {
			DESTINATION: destination
		});
		expect(output).not.toContain('ERR_MODULE_NOT_FOUND');
		expect(output).not.toContain('Could not determine which screenshots to expect');
		expect(code).toBe(0);
	});

	it.each(NO_INSTALL)(
		'%s must not reach any node_modules package by import — the job does not run `npm ci`',
		(script) => {
			expect(packagesReached(join(process.cwd(), '.github', 'scripts', script))).toEqual([]);
		}
	);

	it('must keep a single source: the gate expects exactly what the capturer produces', async () => {
		// The capturer is what PRODUCES the files; the gate is what REQUIRES them. If the two
		// lists diverge, the critic rejects a correct PR. `expectedFiles()` can run here: this
		// test has `node_modules`.
		const output = run(CHECK, { DESTINATION: destinationWith([]) }).output;
		for (const file of await expectedFiles()) expect(output).toContain(file);
	});
});

describe('await-screenshots — finding the evidence run', () => {
	let server: Server;
	let base: string;
	let response: unknown = { workflow_runs: [] };

	beforeAll(async () => {
		server = createServer((_req, res) => {
			res.writeHead(200, { 'content-type': 'application/json' });
			res.end(JSON.stringify(response));
		});
		await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
		const address = server.address();
		base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
	});

	afterAll(() => server.close());

	function wait(extra: Record<string, string> = {}) {
		return runAsync(AWAIT, {
			GITHUB_API_URL: base,
			GITHUB_REPOSITORY: 'owner/repo',
			GITHUB_TOKEN: '',
			SHA,
			TIMEOUT_SECONDS: '1',
			INTERVAL_SECONDS: '1',
			...extra
		});
	}

	it('must return the commit\'s completed run and publish it to GITHUB_OUTPUT', async () => {
		response = {
			workflow_runs: [
				{ id: 111, head_sha: SHA, status: 'completed', conclusion: 'success', run_number: 4 }
			]
		};
		const ghOutput = join(mkdtempSync(join(tmpdir(), 'gh-out-')), 'out.txt');
		writeFileSync(ghOutput, '');
		const { code } = await wait({ GITHUB_OUTPUT: ghOutput });
		expect(code).toBe(0);
		expect(readFileSync(ghOutput, 'utf8')).toContain('run_id=111');
	});

	it('must choose the newest attempt when several runs share the same commit', async () => {
		response = {
			workflow_runs: [
				{ id: 111, head_sha: SHA, status: 'completed', conclusion: 'success', run_number: 4 },
				{ id: 222, head_sha: SHA, status: 'completed', conclusion: 'success', run_number: 7 }
			]
		};
		const { code, output } = await wait();
		expect(code).toBe(0);
		expect(output).toContain('222');
	});

	it('must ignore a run from ANOTHER commit and time out — another commit\'s evidence does not count', async () => {
		response = {
			workflow_runs: [
				{ id: 333, head_sha: 'other'.padEnd(40, '0'), status: 'completed', conclusion: 'success' }
			]
		};
		const { code, output } = await wait();
		expect(code).toBe(1);
		expect(output).toContain('::error::');
	});

	it('must fail immediately when the capturer was SKIPPED — a `paths:` mismatch', async () => {
		response = {
			workflow_runs: [{ id: 444, head_sha: SHA, status: 'completed', conclusion: 'skipped' }]
		};
		const { code, output } = await wait({ TIMEOUT_SECONDS: '60' });
		expect(code).toBe(1);
		expect(output).toContain('SKIPPED');
		expect(output).toContain('paths:');
	});

	it('must exit 1 when the run does not complete in time — fail-closed, never "proceed without evidence"', async () => {
		response = {
			workflow_runs: [{ id: 555, head_sha: SHA, status: 'in_progress', conclusion: null }]
		};
		const { code, output } = await wait();
		expect(code).toBe(1);
		expect(output).toContain('::error::');
		expect(output).toContain('rejects the PR outright');
	});
});

/**
 * The most fragile coupling in this design, and the only one that fails in silence:
 * `design-critic` consumes `screenshots.yml`'s artifact. If the two workflows' `paths:`
 * filters diverge, there is a PR where the critic runs and the capturer doesn't — and then the
 * critic waits 20 minutes for a run that will never exist and fail-closed rejects a correct PR.
 * Nothing in CI would notice until it happened on a real PR, so this test is the guard-rail.
 */
describe('design-critic\'s and screenshots\' paths:', () => {
	/**
	 * Reads the `paths:` block as TEXT, with no YAML parser — same design as
	 * `reentry.test.ts`, including the `\r\n` normalization (checkout on Windows delivers
	 * CRLF). A new dependency just for this guard-rail wouldn't pay for itself.
	 */
	function pathsOf(workflow: string): string[] {
		const text = readFileSync(join(process.cwd(), '.github', 'workflows', workflow), 'utf8')
			.replace(/\r\n/g, '\n')
			.split('\n');
		const start = text.findIndex((line) => /^\s*paths:\s*$/.test(line));
		if (start === -1) return [];
		const items: string[] = [];
		for (const line of text.slice(start + 1)) {
			const matched = line.match(/^\s+- '(.+)'\s*$/);
			if (matched === null) break;
			items.push(matched[1]);
		}
		return items;
	}

	it('must define "touches UI" exactly the same way in both workflows', () => {
		const critic = pathsOf('design-critic.yml');
		expect(critic.length).toBeGreaterThan(0);
		expect(critic).toEqual(pathsOf('screenshots.yml'));
	});

	it('must include its own infra, so a change to it gets exercised', () => {
		const critic = pathsOf('design-critic.yml');
		expect(critic).toContain('.github/scripts/check-visual-evidence.mjs');
		expect(critic).toContain('factory/docs/DESIGN-CRITIC-RUBRIC.md');
	});
});
