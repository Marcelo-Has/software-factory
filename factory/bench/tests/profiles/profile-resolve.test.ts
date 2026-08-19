import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	gateAdaptation,
	moduleManifest,
	readProfile,
	resolvedCommand
} from '../../../../.github/scripts/profile-resolve.mjs';

/**
 * The profile resolver (DECISIONS.md D-012). Two halves, the planted-violation tradition:
 * the pure functions exercised directly against synthetic fixture trees under `fixtures/`
 * (fully self-contained — their own `project/state/profile.json` AND their own
 * `factory/profiles/...` subtree, never the real registry — see D-012's own "known
 * limitation" note on why `data-auth/baas` can't be reused here), and the CLI exercised as a
 * subprocess.
 */

const GATE = join(process.cwd(), '.github', 'scripts', 'profile-resolve.mjs');
const FIXTURES = join(process.cwd(), 'factory', 'bench', 'tests', 'profiles', 'fixtures');
const CLEAN = join(FIXTURES, 'clean');

describe('readProfile', () => {
	it('returns null when project/state/profile.json is absent (no-product mode)', () => {
		expect(readProfile(join(FIXTURES, 'screens-clean'))).toBeNull();
	});

	it('parses the profile when present', () => {
		expect(readProfile(CLEAN)).toEqual({
			frontend: 'demo-fe',
			backend: 'demo-be',
			'data-auth': 'demo-da',
			deploy: 'demo-deploy'
		});
	});
});

describe('moduleManifest against the clean fixture', () => {
	it('returns the parsed module.yaml for an active, complete module', () => {
		const manifest = moduleManifest(CLEAN, 'frontend');
		expect(manifest.name).toBe('demo-fe');
		expect(manifest.status).toBe('complete');
		expect(manifest.commands.lint).toBe('echo lint-fe');
	});
});

describe('moduleManifest fail-closed cases', () => {
	it('throws when the named module directory/module.yaml is missing', () => {
		expect(() => moduleManifest(join(FIXTURES, 'violated-module-missing'), 'deploy')).toThrow(
			/does not exist \(PROFILES\.md §1\)/
		);
	});

	it('throws when the active module is status: skeleton', () => {
		expect(() =>
			moduleManifest(join(FIXTURES, 'violated-skeleton-composed'), 'data-auth')
		).toThrow(/status: skeleton.*PROFILES\.md §5/);
	});

	it('throws when a mandatory field is absent', () => {
		expect(() =>
			moduleManifest(join(FIXTURES, 'violated-missing-mandatory-field'), 'backend')
		).toThrow(/missing mandatory field `behaviors` \(PROFILES\.md §2\)/);
	});

	it('throws when profile.json has no entry for the dimension', () => {
		expect(() => moduleManifest(join(FIXTURES, 'screens-clean'), 'frontend')).toThrow(
			/PROFILES\.md §3/
		);
	});
});

describe('resolvedCommand', () => {
	it('returns [] with no profile.json (no-product mode)', () => {
		expect(resolvedCommand(join(FIXTURES, 'screens-clean'), 'lint')).toEqual([]);
	});

	it('collects across every dimension that declares a non-null command, not one owning dimension', () => {
		const lint = resolvedCommand(CLEAN, 'lint');
		expect(lint).toEqual([
			{ dimension: 'frontend', module: 'demo-fe', command: 'echo lint-fe' },
			{ dimension: 'backend', module: 'demo-be', command: 'echo lint-be' }
		]);
	});

	it('a declared null command contributes nothing (not an error)', () => {
		const build = resolvedCommand(CLEAN, 'build');
		expect(build).toEqual([{ dimension: 'frontend', module: 'demo-fe', command: 'echo build-fe' }]);
	});

	it('propagates a fail-closed error from any dimension in a broken profile', () => {
		expect(() => resolvedCommand(join(FIXTURES, 'violated-skeleton-composed'), 'lint')).toThrow(
			/status: skeleton/
		);
	});
});

describe('gateAdaptation', () => {
	it('returns null with no profile.json', () => {
		expect(gateAdaptation(join(FIXTURES, 'screens-clean'), 'demo_key')).toBeNull();
	});

	it('finds a key declared by a non-first-scanned dimension', () => {
		expect(gateAdaptation(CLEAN, 'preview_url_adapter')).toBe("demo-deploy's own adapter");
	});

	it('returns null when no active module declares the key', () => {
		expect(gateAdaptation(CLEAN, 'no_such_key')).toBeNull();
	});
});

describe('profile-resolve CLI', () => {
	function run(args: string[], cwd: string) {
		const r = spawnSync(process.execPath, [GATE, ...args], { cwd, encoding: 'utf8' });
		return { code: r.status, output: `${r.stdout}${r.stderr}` };
	}

	it('--command prints every resolved command, one per line', () => {
		const { code, output } = run(['--command', 'lint'], CLEAN);
		expect(code).toBe(0);
		expect(output.trim().split('\n')).toEqual(['echo lint-fe', 'echo lint-be']);
	});

	it('--adaptation prints a string value as-is', () => {
		const { code, output } = run(['--adaptation', 'demo_key'], CLEAN);
		expect(code).toBe(0);
		expect(output.trim()).toBe('demo-value');
	});

	it('--adaptation exits 1 when nothing resolves', () => {
		const { code } = run(['--adaptation', 'no_such_key'], CLEAN);
		expect(code).toBe(1);
	});
});

describe('edge cases (built inline — awkward to express as a fixture tree)', () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'profile-resolve-edge-'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it('gateAdaptation returns an object value untouched (not stringified)', () => {
		mkdirSync(join(dir, 'project', 'state'), { recursive: true });
		writeFileSync(join(dir, 'project', 'state', 'profile.json'), JSON.stringify({ frontend: 'fe' }));
		mkdirSync(join(dir, 'factory', 'profiles', 'frontend', 'fe'), { recursive: true });
		writeFileSync(
			join(dir, 'factory', 'profiles', 'frontend', 'fe', 'module.yaml'),
			[
				'name: fe',
				'dimension: frontend',
				'status: complete',
				'app_layout: []',
				'scaffold: []',
				'commands: { lint: null, test: null, build: null, e2e: null }',
				'screenshot: { method: null, preview_adapter: null }',
				'deploy: {}',
				'gate_adaptations:',
				'  structured_key:',
				'    a: 1',
				'    b: 2',
				'behaviors: { applicable: false, runner: null, mapping: null, mock: null }',
				''
			].join('\n')
		);
		expect(gateAdaptation(dir, 'structured_key')).toEqual({ a: 1, b: 2 });
	});
});
