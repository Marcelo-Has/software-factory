// No shebang: this module is IMPORTED (its exports are reused by lint-antipatterns.mjs and
// preview-url.mjs, and by tests), and vitest's transformer rejects a leading `#!` line after
// rewriting imports to CJS. Always invoked as `node .github/scripts/profile-resolve.mjs`,
// never as `./profile-resolve.mjs` directly.
/**
 * The profile resolver (DECISIONS.md D-012) — the first code in this repo that reads
 * `project/state/profile.json` and a module's `module.yaml` (factory/profiles/PROFILES.md).
 * Every consumer wired to a product's active stack goes through this file: `ui-routes.mjs`,
 * `lint-antipatterns.mjs`, `preview-url.mjs`, and `ci.yml`'s `product-*` jobs.
 *
 * FAIL-CLOSED, same posture as `gate-contracts.mjs` (D-007): `moduleManifest` throws on every
 * doubt about a dimension `profile.json` actually names (missing module, `status: skeleton`
 * in a composed dimension, a mandatory field absent) rather than resolving around it. A
 * *missing* `project/state/profile.json` is a different thing — "no product yet" is a valid
 * state everywhere in this API, never an error; only a *present*-but-broken profile fails
 * closed.
 *
 * `resolvedCommand`/`gateAdaptation` scan every dimension `profile.json` names, in the fixed
 * order below — not one "owning" dimension per command/adaptation name. PROFILES.md §1: a
 * valid, D3-concluded profile always resolves all four dimensions to non-skeleton modules, so
 * a skeleton anywhere in a real profile is a broken profile, not a partial one — resolution
 * throws immediately rather than quietly working around the broken dimension.
 *
 * Usage: `node .github/scripts/profile-resolve.mjs --command <lint|test|build|e2e>` prints
 * every resolved command, one per line (nothing declared -> no output, exit 0).
 * `node .github/scripts/profile-resolve.mjs --adaptation <key>` prints the resolved
 * `gate_adaptations` value (objects as JSON) or exits 1 if no active module declares it.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

/** The four fixed dimensions (PROFILES.md §1), in resolution order. */
export const DIMENSIONS = ['frontend', 'backend', 'data-auth', 'deploy'];

const MANDATORY_TOP_FIELDS = [
	'name',
	'dimension',
	'status',
	'app_layout',
	'scaffold',
	'commands',
	'screenshot',
	'deploy',
	'gate_adaptations',
	'behaviors'
];
const MANDATORY_COMMAND_FIELDS = ['lint', 'test', 'build', 'e2e'];
const MANDATORY_SCREENSHOT_FIELDS = ['method', 'preview_adapter'];
const MANDATORY_BEHAVIORS_FIELDS = ['applicable', 'runner', 'mapping', 'mock'];

/**
 * The parsed `project/state/profile.json`, or `null` if it doesn't exist. Absence is
 * "no product yet" — a valid state, not an error.
 * @param {string} cwd
 * @returns {Record<string, string> | null}
 */
export function readProfile(cwd) {
	const path = join(cwd, 'project', 'state', 'profile.json');
	if (!existsSync(path)) return null;
	return JSON.parse(readFileSync(path, 'utf8'));
}

/** `undefined` if present (a mandatory field only needs to exist — `null` is a valid, declared
 *  "not applicable" value per PROFILES.md §2), else the dotted path of the first missing field. */
function firstMissingField(manifest) {
	for (const field of MANDATORY_TOP_FIELDS) {
		if (!(field in manifest)) return field;
	}
	for (const field of MANDATORY_COMMAND_FIELDS) {
		if (!(field in (manifest.commands || {}))) return `commands.${field}`;
	}
	for (const field of MANDATORY_SCREENSHOT_FIELDS) {
		if (!(field in (manifest.screenshot || {}))) return `screenshot.${field}`;
	}
	for (const field of MANDATORY_BEHAVIORS_FIELDS) {
		if (!(field in (manifest.behaviors || {}))) return `behaviors.${field}`;
	}
	return undefined;
}

/**
 * The active module's parsed `module.yaml` for one dimension. FAIL-CLOSED on three doubts,
 * each error pointing at `PROFILES.md`: the module directory/manifest is missing (§1); its
 * `status` is `skeleton` (§5 — a skeleton is never authority to compose); a mandatory field is
 * absent (§2). Throws if `profile.json` names no module at all for `dimension`.
 * @param {string} cwd
 * @param {string} dimension
 * @returns {Record<string, any>}
 */
export function moduleManifest(cwd, dimension) {
	const profile = readProfile(cwd);
	if (profile === null || !(dimension in profile)) {
		throw new Error(
			`project/state/profile.json has no entry for dimension "${dimension}" (PROFILES.md §3).`
		);
	}
	const name = profile[dimension];
	const relPath = `factory/profiles/${dimension}/${name}/module.yaml`;
	const path = join(cwd, ...relPath.split('/'));
	if (!existsSync(path)) {
		throw new Error(
			`project/state/profile.json names "${name}" for dimension "${dimension}", but ` +
				`${relPath} does not exist (PROFILES.md §1).`
		);
	}
	const manifest = parseYaml(readFileSync(path, 'utf8'));
	if (manifest.status === 'skeleton') {
		throw new Error(
			`Dimension "${dimension}"'s active module "${name}" is \`status: skeleton\` — a ` +
				'skeleton is not authority to compose (PROFILES.md §5). Mature the module first, ' +
				'or choose a different one.'
		);
	}
	const missing = firstMissingField(manifest);
	if (missing !== undefined) {
		throw new Error(`${relPath} is missing mandatory field \`${missing}\` (PROFILES.md §2).`);
	}
	return manifest;
}

/**
 * `commands.<name>` from every dimension `profile.json` names whose module declares a
 * non-null value for it. No profile -> `[]`. A `null` command is "not applicable"
 * (PROFILES.md §2), not an error, and contributes nothing.
 * @param {string} cwd
 * @param {'lint'|'test'|'build'|'e2e'} name
 * @returns {{ dimension: string, module: string, command: string }[]}
 */
export function resolvedCommand(cwd, name) {
	const profile = readProfile(cwd);
	if (profile === null) return [];
	const results = [];
	for (const dimension of DIMENSIONS) {
		if (!(dimension in profile)) continue;
		const manifest = moduleManifest(cwd, dimension);
		const command = manifest.commands ? manifest.commands[name] : undefined;
		if (command !== null && command !== undefined) {
			results.push({ dimension, module: manifest.name, command });
		}
	}
	return results;
}

/**
 * The first `gate_adaptations.<key>` found scanning `profile.json`'s dimensions in order. No
 * profile, or no active module declares the key -> `null`.
 * @param {string} cwd
 * @param {string} key
 * @returns {any}
 */
export function gateAdaptation(cwd, key) {
	const profile = readProfile(cwd);
	if (profile === null) return null;
	for (const dimension of DIMENSIONS) {
		if (!(dimension in profile)) continue;
		const manifest = moduleManifest(cwd, dimension);
		const value = manifest.gate_adaptations ? manifest.gate_adaptations[key] : undefined;
		if (value !== undefined) return value;
	}
	return null;
}

function main(argv, cwd = process.cwd()) {
	const commandIdx = argv.indexOf('--command');
	if (commandIdx !== -1) {
		const name = argv[commandIdx + 1];
		for (const { command } of resolvedCommand(cwd, name)) console.log(command);
		return 0;
	}

	const adaptationIdx = argv.indexOf('--adaptation');
	if (adaptationIdx !== -1) {
		const key = argv[adaptationIdx + 1];
		const value = gateAdaptation(cwd, key);
		if (value === null) {
			console.log(`::error::No active module declares gate_adaptations.${key}.`);
			return 1;
		}
		console.log(typeof value === 'string' ? value : JSON.stringify(value));
		return 0;
	}

	console.log('Usage: profile-resolve.mjs --command <lint|test|build|e2e> | --adaptation <key>');
	return 1;
}

// Importable without side effects (the ui-routes.mjs / lint-antipatterns.mjs lesson): only
// run as a CLI when this file is the actual entry point.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	process.exit(main(process.argv.slice(2)));
}
