import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { isCorePath } from '../../../../.claude/hooks/guard-core-writes.mjs';

/**
 * Test of `.claude/hooks/guard-core-writes.mjs`, the marker-gated `PreToolUse` hook that
 * replaced the static `Edit(factory/**)`/`Write(factory/**)` deny (D-008, FACTORY.md's
 * GR-10).
 *
 * Mirrors `pretooluse.test.ts`'s approach — it **executes** (`bash -c`) the hook `command`
 * string read from whichever `.claude/settings.json` is on disk, rather than reimplementing
 * the hook's logic here. One difference: `execFileSync`'s own `cwd` stays pinned to the real
 * repo root (the registered command, `node .claude/hooks/guard-core-writes.mjs`, is a path
 * relative to the repo root, so it wouldn't resolve from inside a fixture dir) — product-mode
 * redirection instead goes through the PAYLOAD's `cwd` field, which is what the hook itself
 * reads. This repo's real `project/` is never touched; every fixture lives under
 * `mkdtempSync(os.tmpdir())` and is removed in `afterEach`.
 */

const ROOT = process.cwd();

type Hook = { type: string; command: string };
type Matcher = { matcher?: string; hooks: Hook[] };

const settings = JSON.parse(readFileSync(`${ROOT}/.claude/settings.json`, 'utf8'));

function hooksFor(matcher: string): Hook[] {
	return (settings.hooks?.PreToolUse ?? [])
		.filter((m: Matcher) => m.matcher === matcher)
		.flatMap((m: Matcher) => m.hooks)
		.filter((h: Hook) => h.type === 'command' && h.command.includes('guard-core-writes.mjs'));
}

const editHooks = hooksFor('Edit|Write|MultiEdit|NotebookEdit');
const bashHooks = hooksFor('Bash');

function payload(cwd: string, toolName: string, toolInput: Record<string, unknown>): string {
	return JSON.stringify({
		session_id: 'test',
		cwd,
		permission_mode: 'default',
		hook_event_name: 'PreToolUse',
		tool_name: toolName,
		tool_input: toolInput,
		tool_use_id: 'toolu_test'
	});
}

/** Runs one hook with the payload on stdin and returns the exit code. */
function runHook(hook: Hook, input: string): number {
	try {
		// cwd intentionally NOT overridden here — bash must resolve the settings.json
		// command's relative path against the REAL repo. Product-mode redirection happens
		// only via the payload's own `cwd` field, on stdin.
		execFileSync('bash', ['-c', hook.command], { input, stdio: ['pipe', 'pipe', 'pipe'] });
		return 0;
	} catch (e) {
		return (e as { status: number }).status;
	}
}

function blocked(hooks: Hook[], input: string): boolean {
	return hooks.some((h) => runHook(h, input) === 2);
}

const fixtures: string[] = [];

/**
 * `marker`: has project/state/init.json (product mode, straightforward).
 * `extra-file`: no init.json, but project/design/notes.md exists (product mode via the
 * anti-bypass heuristic — deleting the marker alone must not reopen the core).
 * `clean`: only README.md/.gitkeep under project/ (not product mode).
 */
function fixture(kind: 'marker' | 'extra-file' | 'clean'): string {
	const dir = mkdtempSync(join(tmpdir(), 'guard-core-writes-'));
	fixtures.push(dir);
	mkdirSync(join(dir, 'project', 'state'), { recursive: true });
	mkdirSync(join(dir, 'factory', 'docs'), { recursive: true });
	mkdirSync(join(dir, '.claude'), { recursive: true });
	writeFileSync(join(dir, 'project', 'README.md'), '# fixture');
	writeFileSync(join(dir, 'project', 'state', '.gitkeep'), '');
	writeFileSync(join(dir, 'factory', 'docs', 'FACTORY.md'), '# fixture factory doc');
	writeFileSync(join(dir, '.claude', 'settings.json'), '{}');
	if (kind === 'marker') writeFileSync(join(dir, 'project', 'state', 'init.json'), '{}');
	if (kind === 'extra-file') {
		mkdirSync(join(dir, 'project', 'design'), { recursive: true });
		writeFileSync(join(dir, 'project', 'design', 'notes.md'), 'not a marker, not exempt');
	}
	return dir;
}

afterEach(() => {
	while (fixtures.length > 0) {
		rmSync(fixtures.pop() as string, { recursive: true, force: true });
	}
});

describe('guard-core-writes hook (.claude/settings.json)', () => {
	it('registers exactly one command hook for the Edit|Write|MultiEdit|NotebookEdit matcher', () => {
		expect(editHooks.length).toBe(1);
	});

	it('registers exactly one guard-core-writes command hook for the Bash matcher', () => {
		expect(bashHooks.length).toBe(1);
	});

	describe('Edit|Write|MultiEdit|NotebookEdit matcher', () => {
		it('blocks Edit on factory/docs/FACTORY.md when project/state/init.json exists (product mode)', () => {
			const cwd = fixture('marker');
			const input = payload(cwd, 'Edit', {
				file_path: join(cwd, 'factory', 'docs', 'FACTORY.md'),
				old_string: 'a',
				new_string: 'b'
			});
			expect(blocked(editHooks, input)).toBe(true);
		});

		it('blocks Write on .claude/settings.json in product mode', () => {
			const cwd = fixture('marker');
			const input = payload(cwd, 'Write', {
				file_path: join(cwd, '.claude', 'settings.json'),
				content: '{}'
			});
			expect(blocked(editHooks, input)).toBe(true);
		});

		it('blocks NotebookEdit under factory/ in product mode (uses notebook_path, not file_path)', () => {
			const cwd = fixture('marker');
			mkdirSync(join(cwd, 'factory', 'notebooks'), { recursive: true });
			writeFileSync(join(cwd, 'factory', 'notebooks', 'x.ipynb'), '{}');
			const input = payload(cwd, 'NotebookEdit', {
				notebook_path: join(cwd, 'factory', 'notebooks', 'x.ipynb'),
				new_source: 'x'
			});
			expect(blocked(editHooks, input)).toBe(true);
		});

		it('allows Edit on project/docs/SPEC.md in product mode (not a core path)', () => {
			const cwd = fixture('marker');
			mkdirSync(join(cwd, 'project', 'docs'), { recursive: true });
			writeFileSync(join(cwd, 'project', 'docs', 'SPEC.md'), '# spec');
			const input = payload(cwd, 'Edit', {
				file_path: join(cwd, 'project', 'docs', 'SPEC.md'),
				old_string: 'a',
				new_string: 'b'
			});
			expect(blocked(editHooks, input)).toBe(false);
		});

		it('allows the same Edit outside product mode (project/ has only README.md/.gitkeep)', () => {
			const cwd = fixture('clean');
			const input = payload(cwd, 'Edit', {
				file_path: join(cwd, 'factory', 'docs', 'FACTORY.md'),
				old_string: 'a',
				new_string: 'b'
			});
			expect(blocked(editHooks, input)).toBe(false);
		});

		it('stays in product mode after init.json is gone, as long as project/ has extra content (anti-bypass)', () => {
			const cwd = fixture('extra-file');
			const input = payload(cwd, 'Write', {
				file_path: join(cwd, '.claude', 'settings.json'),
				content: 'x'
			});
			expect(blocked(editHooks, input)).toBe(true);
		});

		// The planted violation the session's validation step asks to see: comment out the
		// isCorePath() check in guard-core-writes.mjs's main(), rerun this file, watch this
		// case go red, then restore it and confirm green again — proves the test is a real
		// guard, not a false pass.
		it('planted violation: Edit on factory/docs/FACTORY.md in product mode exits 2', () => {
			const cwd = fixture('marker');
			const input = payload(cwd, 'Edit', {
				file_path: join(cwd, 'factory', 'docs', 'FACTORY.md'),
				old_string: 'a',
				new_string: 'b'
			});
			expect(editHooks.some((h) => runHook(h, input) === 2)).toBe(true);
		});
	});

	describe('Bash matcher (defense-in-depth)', () => {
		it('blocks a redirect write into factory/ in product mode', () => {
			const cwd = fixture('marker');
			const input = payload(cwd, 'Bash', { command: 'echo x > factory/docs/FACTORY.md' });
			expect(blocked(bashHooks, input)).toBe(true);
		});

		it('blocks git rm on CLAUDE.md in product mode', () => {
			const cwd = fixture('marker');
			const input = payload(cwd, 'Bash', { command: 'git rm CLAUDE.md' });
			expect(blocked(bashHooks, input)).toBe(true);
		});

		it('allows a plain read of a core file (cat) in product mode', () => {
			const cwd = fixture('marker');
			const input = payload(cwd, 'Bash', { command: 'cat factory/docs/FACTORY.md' });
			expect(blocked(bashHooks, input)).toBe(false);
		});

		it('allows an unrelated command in product mode', () => {
			const cwd = fixture('marker');
			const input = payload(cwd, 'Bash', { command: 'npm test' });
			expect(blocked(bashHooks, input)).toBe(false);
		});

		it('allows the same write command outside product mode', () => {
			const cwd = fixture('clean');
			const input = payload(cwd, 'Bash', { command: 'echo x > factory/docs/FACTORY.md' });
			expect(blocked(bashHooks, input)).toBe(false);
		});
	});

	// ALLOWLIST ships empty (a `const` inside the invoked script — it can't be mutated from
	// outside a subprocess), so this exemption path is unit-tested directly against the
	// exported, pure isCorePath() rather than via a subprocess run. Every other case above
	// stays end-to-end against the real registered hook command.
	describe('ALLOWLIST exemption (unit-tested against the exported isCorePath)', () => {
		it('exempts a path explicitly passed in the allowlist', () => {
			expect(isCorePath(ROOT, 'factory/docs/FACTORY.md', ['factory/docs/FACTORY.md'])).toBe(false);
		});

		it('still blocks the same path with the default (empty) allowlist', () => {
			expect(isCorePath(ROOT, 'factory/docs/FACTORY.md')).toBe(true);
		});

		it('does not exempt an unrelated core path via an unrelated allowlist entry', () => {
			expect(isCorePath(ROOT, 'factory/docs/FACTORY.md', ['factory/templates/'])).toBe(true);
		});
	});
});
