// No shebang: this module is IMPORTED (its `checkContracts` export is reused by
// gate-definition-done.mjs and by tests), and vitest's transformer rejects a leading `#!`
// line. Always invoked as `node .github/scripts/gate-contracts.mjs`, never as
// `./gate-contracts.mjs` directly.
/**
 * Deterministic (NON-AI) gate — the DP-3 logical/integration axis (DECISIONS.md D-007),
 * the sibling of `gate-design-md.mjs` for what a product DOES across a boundary rather than
 * what it looks like. It fails the build when `project/docs/contracts/openapi.yaml`,
 * `contracts/integrations.yaml`, `behaviors/*.feature`, or `nfr.md` are missing, still
 * placeholders, or incomplete per DECISIONS.md D-009's conventions.
 *
 * FAIL-CLOSED on every doubt, same posture as `gate-design-md.mjs`: an unresolvable
 * changed-files list falls back to checking unconditionally, never to skipping.
 *
 * Two modes:
 *   PR mode (default)   applies when the diff touches app/api/**, app/worker/**, a webhook
 *                        route/handler under app/, or the contracts themselves
 *                        (project/docs/contracts/**, project/docs/behaviors/**,
 *                        project/docs/nfr.md). No file list -> unconditional (fail-closed).
 *   --definition         full coverage, always, regardless of changed files. Used by
 *                        gate-definition-done.mjs and by `/fabric-init`.
 * In both modes the same underlying check runs (`checkContracts`) — the mode only changes
 * whether the gate applies at all, never what it checks.
 *
 * Inputs, all by environment (mirrors `gate-design-md.mjs`):
 *   FILES     list of changed files, one per line. Wins over git.
 *   BASE_SHA  the PR's base commit. Without `FILES`, the gate runs
 *             `git diff --name-only BASE_SHA...HEAD`.
 *   neither -> unconditional mode.
 * Artifacts are looked up under `project/docs/`, relative to `cwd` (defaults to
 * `process.cwd()`, overridable for tests).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

/** The five mandatory scenario classes an integration needs covered (DECISIONS.md D-007). */
export const MANDATORY_CLASSES = ['happy', 'duplicate', 'external-failure', 'invalid', 'unauthorized'];

/** PR-mode applicability — plan §0.4.1's fixed path list. */
const CONTRACT_PATTERNS = [
	/^app\/api\//,
	/^app\/worker\//,
	/^app\/.*webhook.*$/i,
	/^project\/docs\/contracts\//,
	/^project\/docs\/behaviors\//,
	/^project\/docs\/nfr\.md$/
];

const IGNORED = [
	/^node_modules\//,
	/^\.svelte-kit\//,
	/^build\//,
	/^dist\//,
	/^\.netlify\//,
	/^test-results\//,
	/^playwright-report\//,
	/^artifacts\//
];

/** `true` if the path is a contract-relevant path per the patterns above. */
export function touchesContracts(path) {
	const p = path.replace(/\\/g, '/').trim();
	if (p === '') return false;
	if (IGNORED.some((re) => re.test(p))) return false;
	return CONTRACT_PATTERNS.some((re) => re.test(p));
}

/**
 * The list of changed files, or `null` when it can't be known — `null` means "check
 * anyway" (fail-closed), never "nothing changed". Same logic as `gate-design-md.mjs`,
 * duplicated locally rather than imported (small, self-contained CLI helper — the same
 * convention `english-only.mjs`/`boundary-check.mjs` already follow for their own
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

/** Broad placeholder detection for YAML/Gherkin D-009 artifacts (extended `[TO FILL IN — ...]`
 *  form), unlike `gate-design-md.mjs`'s exact `[TO FILL IN]` (reused as-is for `.md` artifacts
 *  via its exported `validate`). */
function containsPlaceholder(text) {
	return text.includes('[TO FILL IN');
}

/** Reads and parses a YAML artifact under `project/docs/`. Returns `null` if it doesn't exist. */
function readYaml(cwd, relPath) {
	const path = join(cwd, 'project', 'docs', ...relPath.split('/'));
	if (!existsSync(path)) return null;
	const text = readFileSync(path, 'utf8');
	return { text, data: parseYaml(text) };
}

/** Reads every `.feature` file under `project/docs/behaviors/`. `[]` if the dir doesn't exist. */
function readBehaviors(cwd) {
	const dir = join(cwd, 'project', 'docs', 'behaviors');
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith('.feature'))
		.map((f) => ({ file: f, text: readFileSync(join(dir, f), 'utf8') }));
}

/**
 * Parses Gherkin tags out of a `.feature` file's text. A scenario is the tag line(s)
 * immediately preceding a `Scenario:`/`Scenario Outline:` line — no Gherkin-parser
 * dependency, this repo's contracts are simple enough for a line-oriented scan.
 * Returns `{ scenarios: [{ tags: string[], line }], malformed: [...], classCount: {...} }`.
 */
function parseScenarios(text) {
	const lines = text.split('\n');
	const scenarios = [];
	let pendingTags = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const tagMatches = line.trim().match(/@[\w-]+(?::[\w.-]+)?/g);
		if (tagMatches && /^\s*(@[\w-]+(?::[\w.-]+)?\s*)+$/.test(line)) {
			pendingTags.push(...tagMatches);
			continue;
		}
		if (/^\s*Scenario( Outline)?:/.test(line)) {
			scenarios.push({ tags: pendingTags, line: i + 1 });
			pendingTags = [];
			continue;
		}
		if (line.trim() !== '') pendingTags = [];
	}
	return scenarios;
}

function tagValue(tags, prefix) {
	const found = tags.find((t) => t.startsWith(`${prefix}:`));
	return found ? found.slice(prefix.length + 1) : null;
}

function classTags(tags) {
	return tags.filter((t) => !t.includes(':')).map((t) => t.slice(1)).filter((t) => MANDATORY_CLASSES.includes(t));
}

/**
 * The pure, full-coverage DP-3 check (DECISIONS.md D-007 / plan §0.4.1). Mode never changes
 * what's checked, only whether the caller decides the gate applies (see `main`). Returns
 * `{ ok, findings: [{ code, message, skill }] }`.
 */
export function checkContracts(cwd = process.cwd()) {
	const findings = [];
	const openapi = readYaml(cwd, 'contracts/openapi.yaml');
	const integrations = readYaml(cwd, 'contracts/integrations.yaml');
	const milestones = readYaml(cwd, 'milestones.yaml');
	const behaviors = readBehaviors(cwd);
	const nfrPath = join(cwd, 'project', 'docs', 'nfr.md');

	if (openapi === null) {
		findings.push({
			code: 'contract-missing',
			message: '`project/docs/contracts/openapi.yaml` does not exist.',
			skill: '/define-architecture'
		});
	} else if (containsPlaceholder(openapi.text)) {
		findings.push({
			code: 'contract-placeholder',
			message: '`project/docs/contracts/openapi.yaml` still has `[TO FILL IN` placeholders.',
			skill: '/define-architecture'
		});
	}

	if (integrations === null) {
		findings.push({
			code: 'contract-missing',
			message: '`project/docs/contracts/integrations.yaml` does not exist.',
			skill: '/define-architecture'
		});
	} else if (containsPlaceholder(integrations.text)) {
		findings.push({
			code: 'contract-placeholder',
			message: '`project/docs/contracts/integrations.yaml` still has `[TO FILL IN` placeholders.',
			skill: '/define-architecture'
		});
	}

	// Right-sizing (DECISIONS.md D-007): nothing to check further when both contracts are
	// absent/placeholder — those two findings above already say so.
	const openapiPaths =
		openapi && !containsPlaceholder(openapi.text) ? openapi.data?.paths || {} : {};
	const operationIds = [];
	for (const [route, methods] of Object.entries(openapiPaths)) {
		for (const [method, op] of Object.entries(methods || {})) {
			if (!op || !op.operationId) {
				findings.push({
					code: 'operation-missing-id',
					message: `\`${method.toUpperCase()} ${route}\` in openapi.yaml has no \`operationId\`.`,
					skill: '/define-architecture'
				});
				continue;
			}
			operationIds.push(op.operationId);
		}
	}

	const integrationList =
		integrations && !containsPlaceholder(integrations.text) ? integrations.data?.integrations || [] : [];
	const integrationIds = integrationList.map((i) => i.id).filter(Boolean);

	// Parse every scenario across every behaviors file, checking malformed/orphan as we go.
	const endpointScenarioCount = new Map(operationIds.map((id) => [id, 0]));
	const integrationClasses = new Map(integrationIds.map((id) => [id, new Set()]));
	for (const { file, text } of behaviors) {
		for (const scenario of parseScenarios(text)) {
			const endpointId = tagValue(scenario.tags, '@endpoint');
			const integrationId = tagValue(scenario.tags, '@integration');
			const classes = classTags(scenario.tags);

			if ((endpointId === null && integrationId === null) || classes.length !== 1) {
				findings.push({
					code: 'scenario-malformed',
					message: `${file}:${scenario.line} is malformed — needs an \`@endpoint\` and/or \`@integration\` tag, plus exactly one class tag.`,
					skill: '/define-spec'
				});
				continue;
			}

			if (endpointId !== null) {
				if (!operationIds.includes(endpointId)) {
					findings.push({
						code: 'scenario-orphan',
						message: `${file}:${scenario.line} tags \`@endpoint:${endpointId}\`, which doesn't exist in openapi.yaml.`,
						skill: '/define-spec'
					});
				} else {
					endpointScenarioCount.set(endpointId, (endpointScenarioCount.get(endpointId) || 0) + 1);
				}
			}
			if (integrationId !== null) {
				if (!integrationIds.includes(integrationId)) {
					findings.push({
						code: 'scenario-orphan',
						message: `${file}:${scenario.line} tags \`@integration:${integrationId}\`, which doesn't exist in integrations.yaml.`,
						skill: '/define-spec'
					});
				} else {
					integrationClasses.get(integrationId).add(classes[0]);
				}
			}
		}
	}

	for (const operationId of operationIds) {
		if ((endpointScenarioCount.get(operationId) || 0) === 0) {
			findings.push({
				code: 'endpoint-missing-scenario',
				message: `Endpoint \`${operationId}\` has no scenario tagged \`@endpoint:${operationId}\`.`,
				skill: '/define-spec'
			});
		}
	}

	for (const id of integrationIds) {
		const covered = integrationClasses.get(id) || new Set();
		const missing = MANDATORY_CLASSES.filter((c) => !covered.has(c));
		for (const cls of missing) {
			findings.push({
				code: 'integration-missing-class',
				message: `Integration \`${id}\` has no \`@integration:${id}\` scenario tagged \`@${cls}\`.`,
				skill: '/define-spec'
			});
		}
	}

	// Endpoint/integration -> milestone coverage.
	const milestoneList = milestones?.data?.milestones || [];
	const milestonedEndpoints = new Set(milestoneList.flatMap((m) => m.endpoints || []));
	const milestonedIntegrations = new Set(milestoneList.flatMap((m) => m.integrations || []));
	for (const operationId of operationIds) {
		if (!milestonedEndpoints.has(operationId)) {
			findings.push({
				code: 'endpoint-missing-milestone',
				message: `Endpoint \`${operationId}\` is not listed in any milestone's \`endpoints[]\`.`,
				skill: '/plan-milestones'
			});
		}
	}
	for (const id of integrationIds) {
		if (!milestonedIntegrations.has(id)) {
			findings.push({
				code: 'integration-missing-milestone',
				message: `Integration \`${id}\` is not listed in any milestone's \`integrations[]\`.`,
				skill: '/plan-milestones'
			});
		}
	}

	// nfr.md, required only once the product has its own endpoints (right-sizing).
	if (operationIds.length > 0) {
		if (!existsSync(nfrPath)) {
			findings.push({
				code: 'nfr-missing',
				message: '`project/docs/nfr.md` does not exist, and this product has its own endpoints.',
				skill: '/define-architecture'
			});
		} else {
			const nfrText = readFileSync(nfrPath, 'utf8');
			if (nfrText.includes('[TO FILL IN')) {
				findings.push({
					code: 'nfr-placeholder',
					message: '`project/docs/nfr.md` still has `[TO FILL IN` placeholders.',
					skill: '/define-architecture'
				});
			}
		}
	}

	if (
		findings.length === 0 &&
		integrationIds.length === 0 &&
		operationIds.length === 0
	) {
		console.log(
			'No own endpoints and no integrations — the logical axis costs zero for this product (right-sizing, DECISIONS.md D-007).'
		);
	}

	return { ok: findings.length === 0, findings };
}

function main(argv, cwd = process.cwd()) {
	const definitionMode = argv.includes('--definition');

	if (!definitionMode) {
		const changed = changedFiles();
		if (changed !== null) {
			const touched = changed.filter(touchesContracts);
			if (touched.length === 0) {
				console.log(
					`None of the ${changed.length} changed file(s) touch contract paths — gate doesn't apply.`
				);
				return 0;
			}
			console.log(`Contract-relevant files in this PR:\n  ${touched.join('\n  ')}`);
		} else {
			console.log('No changed-files list — checking the DP-3 contracts unconditionally.');
		}
	}

	const { ok, findings } = checkContracts(cwd);
	if (!ok) {
		for (const f of findings) {
			console.log(`::error::${f.message} (${f.skill})`);
		}
		return 1;
	}
	console.log('DP-3 contracts (openapi/integrations/behaviors/nfr/milestones) are complete.');
	return 0;
}

// Importable without side effects (the ui-routes.mjs / lint-antipatterns.mjs lesson): only
// run as a CLI when this file is the actual entry point.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	process.exit(main(process.argv.slice(2)));
}
