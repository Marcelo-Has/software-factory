// No shebang: this module is IMPORTED (its exports are reused by tests), and vitest's
// transformer rejects a leading `#!` line. Always invoked as
// `node .github/scripts/gate-behavior-mirror.mjs`, never as `./gate-behavior-mirror.mjs`
// directly.
/**
 * Deterministic (NON-AI) gate — the DP-3 mirror-coverage half (DECISIONS.md D-013), closing
 * the gap `gate-contracts.mjs` deliberately leaves open: that gate checks a `.feature`
 * scenario is well-formed and tagged; this one checks the scenario actually has a mirrored,
 * non-placeholder test that runs it, per the fixed Node-family contract (D-010,
 * `module.yaml`'s `behaviors.mapping`).
 *
 * FAIL-CLOSED on every doubt, same posture as `gate-contracts.mjs`. Right-sizes to exit 0
 * with a stated reason when there's no product, no applicable backend behaviors, or no
 * behavior scenarios yet (DECISIONS.md D-007) — never a silent skip.
 *
 * Four failure classes, each mechanically checked, no Gherkin-parser dependency (same
 * line/regex-oriented philosophy as `gate-contracts.mjs`):
 *   mirror-missing        a `.feature` file has no mirror file at its resolved path.
 *   scenario-uncovered    a `.feature`'s `@scenario:<slug>` has no matching comment in the mirror.
 *   mirror-comment-orphan the mirror has an `@scenario:<slug>` comment absent from the `.feature`.
 *   mirror-placeholder    the mirror exists, slugs match, but has zero `test(`/`it(` calls.
 *
 * PR-mode applicability: the same contract paths `gate-contracts.mjs` uses
 * (`touchesContracts`, imported, not duplicated) plus the resolved mirror-test directory. No
 * file list -> unconditional (fail-closed), same as `gate-contracts.mjs`.
 *
 * Inputs, all by environment (mirrors `gate-contracts.mjs`):
 *   FILES     list of changed files, one per line. Wins over git.
 *   BASE_SHA  the PR's base commit. Without `FILES`, the gate runs
 *             `git diff --name-only BASE_SHA...HEAD`.
 *   neither -> unconditional mode.
 *
 * `--print-test-command` prints the active backend module's resolved `commands.test` (nothing
 * when not applicable / no product — same "declared null = not an error" convention
 * `profile-resolve.mjs` already uses) so `ci.yml`'s `product-behaviors` job can run the
 * mirrored tests after this gate passes, without needing a `--dimension` filter on
 * `profile-resolve.mjs`'s own `--command` flag (which would print both the frontend's and the
 * backend's `test` command, mixed together).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { touchesContracts } from './gate-contracts.mjs';
import { moduleManifest, readProfile } from './profile-resolve.mjs';

/**
 * The list of changed files, or `null` when it can't be known — `null` means "check anyway"
 * (fail-closed), never "nothing changed". Same logic as `gate-contracts.mjs`, duplicated
 * locally rather than imported (it's a private helper there, and this is the same convention
 * `english-only.mjs`/`boundary-check.mjs`/`gate-contracts.mjs` already follow for their own
 * near-identical file-walking helpers).
 */
function changedFiles() {
	const explicit = process.env.FILES;
	if (explicit !== undefined && explicit.trim() !== '') {
		return explicit.split('\n').filter((l) => l.trim() !== '');
	}
	const base = (process.env.BASE_SHA || '').trim();
	if (base === '') return null;
	try {
		const output = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
			encoding: 'utf8'
		});
		return output.split('\n').filter((l) => l.trim() !== '');
	} catch (error) {
		console.log(`::warning::Could not diff against ${base} (${error.message.trim()}).`);
		return null;
	}
}

/** Every `.feature` file under `project/docs/behaviors/`, `[]` if the dir doesn't exist. */
function readFeatureFiles(cwd) {
	const dir = join(cwd, 'project', 'docs', 'behaviors');
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith('.feature'))
		.map((f) => ({ file: f, path: join(dir, f), text: readFileSync(join(dir, f), 'utf8') }));
}

/** Every `@scenario:<slug>` occurrence in a `.feature`/mirror file's text — a "grep-verifiable
 *  comment" needs no more structure than this. */
function scenarioSlugs(text) {
	const matches = text.matchAll(/@scenario:([\w-]+)/g);
	return [...new Set([...matches].map((m) => m[1]))];
}

/** `true` when the text has at least one `test(`/`it(` call — a mirror with none is a
 *  placeholder, not an executable spec. */
function hasTestCalls(text) {
	return /\b(test|it)\s*\(/.test(text);
}

/**
 * The active backend module's mirror-path templates, resolved from `behaviors.mapping`'s
 * prose (D-010's fixed Node-family convention, e.g. `"app/api/tests/behaviors/<feature>.test.ts
 * mirrors project/docs/behaviors/<feature>.feature, ..."`). The mapping is prose, not
 * structured data — this extracts its first two whitespace-delimited tokens, which is exactly
 * the convention every Node-family module.yaml already follows.
 * @returns {{ mirrorTemplate: string, featureTemplate: string } | null} `null` if the mapping
 *  doesn't start with the expected `<mirror> mirrors <feature>` shape.
 */
export function mirrorPathTemplates(manifest) {
	const mapping = manifest.behaviors?.mapping;
	if (typeof mapping !== 'string') return null;
	const m = /^(\S+)\s+mirrors\s+(\S+)/.exec(mapping.trim());
	if (!m) return null;
	return { mirrorTemplate: m[1], featureTemplate: m[2] };
}

/** The concrete mirror path for one `.feature` file's basename (`<name>.feature`). */
function resolveMirrorPath(cwd, mirrorTemplate, featureFileName) {
	const featureName = featureFileName.replace(/\.feature$/, '');
	const relPath = mirrorTemplate.replace('<feature>', featureName);
	return join(cwd, ...relPath.split('/'));
}

/**
 * The backend module's manifest, or a right-sizing `reason` when there's nothing (yet) for
 * this gate to check. Never throws for "no product" / "not applicable" — those are valid
 * states (mirrors `profile-resolve.mjs`'s own "declared null = not applicable" posture); a
 * present-but-broken profile/module still fails closed by letting `moduleManifest`'s own
 * error propagate to the caller.
 * @returns {{ manifest: object } | { reason: string }}
 */
function resolveBackendBehaviors(cwd) {
	if (readProfile(cwd) === null) {
		return { reason: 'No active profile yet — the behaviors-mirror gate does not apply (right-sizing, DECISIONS.md D-007).' };
	}
	const manifest = moduleManifest(cwd, 'backend');
	if (!manifest.behaviors?.applicable) {
		return {
			reason: `The active backend module ("${manifest.name}") declares behaviors.applicable: false — nothing to mirror (right-sizing, DECISIONS.md D-007).`
		};
	}
	return { manifest };
}

/**
 * The pure, full-coverage mirror-coverage check (DECISIONS.md D-013 / plan §0.4.1). Returns
 * `{ ok, findings, reason }` — `reason` is set only on a right-sizing early exit, in which
 * case `findings` is always `[]` and `ok` is always `true`.
 * @param {string} cwd
 * @returns {{ ok: boolean, findings: { code: string, message: string }[], reason?: string }}
 */
export function checkBehaviorMirror(cwd = process.cwd()) {
	const resolved = resolveBackendBehaviors(cwd);
	if ('reason' in resolved) {
		return { ok: true, findings: [], reason: resolved.reason };
	}
	const { manifest } = resolved;

	const features = readFeatureFiles(cwd);
	if (features.length === 0) {
		return {
			ok: true,
			findings: [],
			reason: 'No behavior scenarios declared yet under project/docs/behaviors/ — the mirror gate costs nothing until they exist (right-sizing, DECISIONS.md D-007).'
		};
	}

	const templates = mirrorPathTemplates(manifest);
	if (templates === null) {
		return {
			ok: false,
			findings: [
				{
					code: 'mapping-unparseable',
					message: `"${manifest.name}"'s module.yaml behaviors.mapping does not start with the expected "<mirror-path> mirrors <feature-path>" convention (PROFILES.md §4).`
				}
			]
		};
	}

	const findings = [];
	for (const { file, text: featureText } of features) {
		const mirrorPath = resolveMirrorPath(cwd, templates.mirrorTemplate, file);
		if (!existsSync(mirrorPath)) {
			findings.push({
				code: 'mirror-missing',
				message: `${file} has no mirror test at ${mirrorPath.replace(cwd, '').replace(/\\/g, '/').replace(/^\//, '')} — write it in the same PR that adds this scenario (plan §0.4.3).`
			});
			continue;
		}

		const mirrorText = readFileSync(mirrorPath, 'utf8');
		const featureSlugs = scenarioSlugs(featureText);
		const mirrorSlugs = scenarioSlugs(mirrorText);

		for (const slug of featureSlugs) {
			if (!mirrorSlugs.includes(slug)) {
				findings.push({
					code: 'scenario-uncovered',
					message: `${file}'s @scenario:${slug} has no matching @scenario:${slug} comment in its mirror (${file.replace(/\.feature$/, '')}).`
				});
			}
		}
		for (const slug of mirrorSlugs) {
			if (!featureSlugs.includes(slug)) {
				findings.push({
					code: 'mirror-comment-orphan',
					message: `The mirror for ${file} has an @scenario:${slug} comment, but ${file} has no such scenario.`
				});
			}
		}
		if (!hasTestCalls(mirrorText)) {
			findings.push({
				code: 'mirror-placeholder',
				message: `The mirror for ${file} has no \`test(\`/\`it(\` calls — it's a placeholder, not an executable spec.`
			});
		}
	}

	return { ok: findings.length === 0, findings };
}

/**
 * `true` if the path is contract-relevant per `gate-contracts.mjs`'s own patterns, or falls
 * under the active backend module's resolved mirror-test directory. A `moduleManifest` throw
 * (broken/absent profile) falls back to `touchesContracts` alone — applicability shouldn't
 * itself fail closed the way the underlying check does.
 */
export function touchesBehaviorMirror(path, cwd = process.cwd()) {
	if (touchesContracts(path)) return true;
	try {
		const resolved = resolveBackendBehaviors(cwd);
		if ('reason' in resolved) return false;
		const templates = mirrorPathTemplates(resolved.manifest);
		if (templates === null) return false;
		const mirrorDir = dirname(templates.mirrorTemplate.replace('<feature>', '__any__')).replace(/\\/g, '/') + '/';
		const p = path.replace(/\\/g, '/').trim();
		return p.startsWith(mirrorDir);
	} catch {
		return false;
	}
}

function main(argv, cwd = process.cwd()) {
	if (argv.includes('--print-test-command')) {
		const resolved = resolveBackendBehaviors(cwd);
		if ('reason' in resolved) return 0;
		const command = resolved.manifest.commands?.test;
		if (command) console.log(command);
		return 0;
	}

	const changed = changedFiles();
	if (changed !== null) {
		const touched = changed.filter((p) => touchesBehaviorMirror(p, cwd));
		if (touched.length === 0) {
			console.log(
				`None of the ${changed.length} changed file(s) touch behavior-mirror paths — gate doesn't apply.`
			);
			return 0;
		}
		console.log(`Behavior-mirror-relevant files in this PR:\n  ${touched.join('\n  ')}`);
	} else {
		console.log('No changed-files list — checking the behaviors mirror unconditionally.');
	}

	const { ok, findings, reason } = checkBehaviorMirror(cwd);
	if (reason) {
		console.log(reason);
		return 0;
	}
	if (!ok) {
		for (const f of findings) {
			console.log(`::error::${f.message}`);
		}
		return 1;
	}
	console.log('DP-3 behaviors mirror (feature scenarios <-> mirrored tests) is complete.');
	return 0;
}

// Importable without side effects (the ui-routes.mjs / lint-antipatterns.mjs lesson): only
// run as a CLI when this file is the actual entry point.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	process.exit(main(process.argv.slice(2)));
}
