// No shebang, unlike its siblings in this folder: this module is IMPORTED by the harness
// tests, and vitest's transformer rejects `#!` after rewriting imports to CJS ("Invalid
// Character `!`"). It's never run as `./script.mjs` directly — it's always `node`, via
// `npm run lint:antipatterns` and the `ci` job.
/**
 * The deterministic lint for the [LINT]-tagged antipatterns.
 *
 * `.claude/rules/design-antipatterns.md` marks each item as **[LINT]** (verifiable by
 * grep/AST/a static rule) or **[CRITIC]** (requires judgment on the rendered result). This
 * script is the gate for the [LINT] subset — until it exists, the rule says those items are
 * "manual check by `developer-frontend`", i.e. not actually checked.
 *
 * THE RULE'S POLICY APPLIES HERE, IN FULL. Nothing is absolutely forbidden: every item is
 * allowed with a recorded justification. The shape of that justification in this gate is one
 * line at the point of use:
 *
 *     <!-- antipattern-ok: 6 -- this fixed height is for the PDF, not the screen; see DESIGN.md -->
 *     and, in CSS, the same text inside a block comment.
 *
 * The number is the rule's item number, and the text after `--` is mandatory: an anonymous
 * silencing is itself a finding (`empty-justification`), and a silencing that silences
 * nothing is also a finding (`useless-justification`) — that's what keeps the residual false
 * positive from accumulating: the exception doesn't outlive the fix that made it unnecessary.
 *
 * WHAT THIS GATE COVERS, AND WHAT IT LEAVES TO THE CRITIC — on purpose. Only PRECISE
 * detectors get in. A [LINT] item whose text-based detection would false-positive on
 * legitimate copy stays out, and the gap is declared in `NOT_DETECTED`, with a reason: a
 * deterministic gate that rejects the correct thing is worse than a gate that doesn't run,
 * because it teaches people to ignore it.
 *
 * NO DEPENDENCY, like the rest of `.github/scripts/`: only `node:fs`. Runs via `npm run
 * lint` and the `ci` job in `ci.yml`.
 *
 * Usage:
 *     node .github/scripts/lint-antipatterns.mjs                  # scans the UI paths
 *     node .github/scripts/lint-antipatterns.mjs file1 file2 ...  # scans only what's passed
 *     node .github/scripts/lint-antipatterns.mjs --list           # prints the detectors, no scan
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// ---- profile extension point: framework-specific selectors ----
// SvelteKit is the first (and, in this generic core, only) profile wired here. A different
// profile (React, Vue, ...) swaps this block: where UI source lives, which extensions count,
// which build directories to ignore, and the framework's own event-directive syntax used by
// the scroll-hijack detector (item 53) below.
const ROOTS = ['app/web/src'];
const EXTENSIONS = ['.svelte', '.css', '.html'];
const IGNORED_DIRS = new Set(['node_modules', '.svelte-kit', 'build', 'dist', '.git']);
/** SvelteKit's `on:scroll` event directive — the framework-specific half of item 53. */
const FRAMEWORK_SCROLL_DIRECTIVE_SOURCE = 'on:scroll';
// ---- end profile extension point ----

/**
 * Files this gate does NOT scan even when they're under `ROOTS`. An entry here is a
 * file-level allowlist and needs a written reason. Empty until a profile ships an actual
 * design-token file (the literal color/size values THERE are the token system these
 * detectors exist to protect, and would otherwise flag themselves).
 */
const ALLOWLIST_FILES = [];

/**
 * `line` is 1-indexed. `snippet` is what shows in the message, trimmed to fit.
 * @param {number} item
 * @param {string} id
 * @param {string} message
 * @param {string} file
 * @param {number} line
 * @param {string} snippet
 */
function finding(item, id, message, file, line, snippet) {
	return { item, id, message, file, line, snippet: snippet.trim().slice(0, 90) };
}

/**
 * One detector per rule item. `target` limits which extension it applies to; `search` receives
 * the whole content (for multiline rules) and returns `{ line, snippet }`.
 *
 * Regex over TEXT, not an AST, and that's a right-sizing decision: a `.svelte` parser would
 * bring a new dependency and a new failure mode to find patterns that are literally textual.
 */
const DETECTORS = [
	{
		item: 6,
		id: 'vh-instead-of-dvh',
		description: '`100vh` (or `vh` in a height) where `dvh` is correct',
		target: ['.svelte', '.css', '.html'],
		regex: /(?:^|[^a-z-])(?:min-|max-)?height\s*:\s*[^;{}]*?\d[\d.]*vh\b/gim,
		message:
			'height in `vh`. The in-app browser chrome shows and hides: use `dvh` instead.'
	},
	{
		item: 12,
		id: 'born-invisible',
		description: 'content born `opacity: 0` / `visibility: hidden` waiting on JS',
		target: ['.svelte', '.css'],
		regex: /(?:^|[^a-z-])(opacity\s*:\s*0(?!\.)\s*[;}]|visibility\s*:\s*hidden\s*[;}])/gim,
		message: 'content is born invisible waiting on JS. Without JS it never appears — and a crawler never sees it.'
	},
	{
		item: 14,
		id: 'glassmorphism',
		description: 'decorative `backdrop-filter` with no real layered overlap',
		target: ['.svelte', '.css'],
		regex: /(?:^|[^a-z-])(-webkit-)?backdrop-filter\s*:/gim,
		message: '`backdrop-filter`. Glassmorphism needs a real overlap of layers to justify it — a flat surface with blur behind it isn\'t elevation.'
	},
	{
		item: 15,
		id: 'multi-layer-shadow',
		description: 'three or more `box-shadow`s stacked on the same element',
		target: ['.svelte', '.css'],
		regex: /box-shadow\s*:\s*[^;{}]*?,[^;{}]*?,[^;{}]*?;/gim,
		message: 'stacked box-shadow. Three or more layered shadows on one element is decorative elevation, not real depth.'
	},
	{
		item: 18,
		id: 'giant-radius',
		description: '`border-radius` >= 24px, uniform, from button to container',
		target: ['.svelte', '.css'],
		regex: /border-radius\s*:\s*(?:(?:[2-9]\d|\d{3,})px|(?:[2-9]|\d{2,})(?:\.\d+)?rem)\b/gim,
		message: 'radius >= 24px. A uniform giant radius from button to page container reads as a template default, not a considered scale.'
	},
	{
		item: 22,
		id: 'striped-background',
		description: 'decorative striped/grid background via `repeating-linear-gradient`',
		target: ['.svelte', '.css'],
		regex: /repeating-(linear|radial|conic)-gradient\s*\(/gim,
		message: 'repeated gradient used as a decorative background texture, with no surface asking for it.'
	},
	{
		item: 26,
		id: 'purple-cyan-gradient',
		description: 'purple -> cyan/lilac gradient as the default palette',
		target: ['.svelte', '.css'],
		// A gradient whose ramp has a color in the purple/violet arc AND another in the
		// cyan/turquoise arc. The real check is the `purpleCyanGradient` filter below; the
		// regex only finds the candidate.
		regex: /(linear|radial|conic)-gradient\s*\([^)]*\)/gim,
		filter: purpleCyanGradient,
		message: 'purple-to-cyan gradient, the palette that falls out of a generator by default. Use the product\'s own accent token instead.'
	},
	{
		item: 27,
		id: 'gradient-text',
		description: 'text filled with a gradient',
		target: ['.svelte', '.css'],
		regex: /background-clip\s*:\s*text|-webkit-text-fill-color\s*:\s*transparent/gim,
		message: 'gradient-filled text. Typographic voice comes from the typeface, not a fill effect.'
	},
	{
		item: 28,
		id: 'pure-black',
		description: '`#000` as text or background',
		target: ['.svelte', '.css', '.html'],
		regex: /(?:^|[^0-9a-fA-F#])#(?:000|000000|000000ff)\b|\brgba?\(\s*0\s*,\s*0\s*,\s*0\s*[,)]/gim,
		message: 'pure black. Neither `#000` nor a fully desaturated gray belongs anywhere the neutrals should pull from the accent.'
	},
	{
		item: 36,
		id: 'default-system-font',
		description: 'Inter/Roboto/a system font as the product\'s default type voice',
		target: ['.svelte', '.css', '.html'],
		// Only the FIRST family in the stack is the voice; `system-ui` at the end of the
		// fallback chain is legitimate.
		regex: /font-family\s*:\s*([^;{}]+)/gim,
		filter: defaultSystemFontAsVoice,
		message: 'default browser/OS font as the product\'s voice. Declare an actual type family instead of falling through to the platform default.'
	},
	{
		item: 47,
		id: 'overshoot-easing',
		description: '`bounce`/`elastic`/an overshoot cubic-bezier as the default easing',
		target: ['.svelte', '.css'],
		regex: /cubic-bezier\s*\([^)]*\)|\b(bounce|elastic|back(in|out)?)\b\s*[;,)]/gim,
		filter: overshootEasing,
		message: 'overshoot curve. Pick one deliberate easing for the product instead of a bounce/elastic default.'
	},
	{
		item: 50,
		id: 'animates-layout',
		description: 'animating `width`/`height`/`top`/`left`/`margin`/`padding`',
		target: ['.svelte', '.css'],
		regex:
			/transition(-property)?\s*:\s*[^;{}]*\b(width|height|top|left|right|bottom|margin|padding)\b/gim,
		message: 'transition on a layout property. Animate only `transform` and `opacity` — everything else forces a relayout every frame.'
	},
	{
		item: 51,
		id: 'decorative-motion',
		description: 'auto-scrolling marquee or decorative pulsing dot',
		target: ['.svelte', '.css'],
		regex: /<marquee|animation\s*:\s*[^;{}]*\b(pulse|blink|marquee|ping)\b/gim,
		message: 'looping decorative motion. Reserve authored motion for a deliberate, singular moment — not an ambient loop.'
	},
	{
		item: 52,
		id: 'custom-cursor',
		description: 'custom cursor',
		target: ['.svelte', '.css'],
		regex: /cursor\s*:\s*url\s*\(/gim,
		message: 'custom cursor. Nothing about a product design contract typically requires replacing the system pointer.'
	},
	{
		item: 53,
		id: 'scroll-driven-animation',
		description: '`addEventListener("scroll", ...)` (or the framework equivalent) driving animation',
		target: ['.svelte'],
		regex: new RegExp(
			`addEventListener\\s*\\(\\s*['"\`]scroll['"\`]|${FRAMEWORK_SCROLL_DIRECTIVE_SOURCE}|onscroll\\s*=`,
			'gim'
		),
		message: 'animation driven by a scroll event listener. Use `IntersectionObserver` or CSS scroll-driven animation instead.'
	},
	{
		item: 55,
		id: 'focus-erased',
		description: '`outline: none` on focus with no visible replacement indicator',
		target: ['.svelte', '.css'],
		regex: /outline\s*:\s*(none|0)\s*[;}]/gim,
		message: '`outline: none`. Every control needs a visible focus indicator from the first commit: `outline: 2px solid var(--focus)` plus `outline-offset: 2px`.'
	},
	{
		item: 60,
		id: 'lorem-ipsum',
		description: 'lorem ipsum or any filler text',
		target: ['.svelte', '.html'],
		regex:
			/\b(lorem\s+ipsum|dolor\s+sit\s+amet|consectetur\s+adipiscing|sample\s+text|placeholder\s+text|TODO:?\s*(text|copy)|blah\s*blah)\b/gim,
		message: 'filler text. Product copy is content, not a reserved space.'
	},
	{
		item: 61,
		id: 'poetic-placeholder',
		description: 'poetic placeholder copy like "Your Journey Starts Here"',
		target: ['.svelte', '.html'],
		regex:
			/\b(your\s+journey(\s+starts\s+here)?|unforgettable\s+moments|a\s+moment\s+to\s+cherish|once[- ]in[- ]a[- ]lifetime|memories\s+that\s+last)\b/gim,
		message: 'poetic placeholder copy. Write about THIS product\'s specific offer, not a generic marketing mood.'
	},
	{
		item: 62,
		id: 'generic-cta',
		description: '"Get Started" (or similar) as the generic primary CTA',
		target: ['.svelte', '.html'],
		regex: />\s*(get\s+started|start\s+now|learn\s+more|click\s+here|submit|ok)\s*</gim,
		message: 'generic action label. The label should name the action AND make what comes next predictable ("Continue to photos").'
	},
	{
		item: 63,
		id: 'buzzword',
		description: 'marketing buzzword',
		target: ['.svelte', '.html'],
		regex:
			/\b(revolutioniz\w*|empower\w*|unique\s+experience|next-?gen|seamless|disrupt\w*|cutting-edge|state[- ]of[- ]the[- ]art)\b/gim,
		message: 'marketing buzzword. Write in one register: direct and concrete.'
	},
	{
		item: 64,
		id: 'generic-sample-data',
		description: 'generic example data ("John Doe", "Acme", "user@email.com")',
		target: ['.svelte', '.html'],
		regex:
			/\b(john\s+doe|jane\s+doe|acme(?:\s+corp)?|lorem\s+corp|user@email\.com|user@example\.com|test\s+user|foo\s+bar)\b/gim,
		message: 'generic example data. An empty state needs a real, specific example — never a placeholder name.'
	},
	{
		item: 65,
		id: 'generic-step-label',
		description: '"Step 1 / Step 2 / Step 3" instead of the step\'s actual name',
		target: ['.svelte', '.html'],
		regex: />\s*(step)\s+\d+\s*</gim,
		message: 'generic step label. Name the step: what the user is actually doing there.'
	},
	{
		item: 66,
		id: 'metadata-strip',
		description: 'decorative metadata strip (city · time · version · build)',
		target: ['.svelte', '.html'],
		regex: /\bbuild\s*[·|]\s*v?\d|\bv\d+\.\d+\.\d+\s*[·|]/gim,
		message: 'decorative metadata strip on a product page.'
	},
	{
		item: 67,
		id: 'scroll-hint',
		description: 'a scroll hint ("scroll to explore")',
		target: ['.svelte', '.html'],
		regex: /(scroll\s+(down|to\s+explore)|swipe\s+down)/gim,
		message: 'scroll hint. The scrollbar is already the affordance.'
	},
	{
		item: 68,
		id: 'missing-or-generic-alt',
		description: 'missing `alt`, or generic ("image", "photo"), on a non-decorative image',
		target: ['.svelte', '.html'],
		regex: /<img\b[^>]*>/gim,
		filter: missingOrGenericAlt,
		message: '`<img>` with no `alt`, or a generic one. `alt=""` is legitimate only on a purely decorative image.'
	}
];

/**
 * The [LINT] items this gate does NOT detect, and why. This exists to be READ — a dedicated
 * test compares this list plus the detectors above against the rule's own [LINT] marks and
 * fails if a new item shows up there without becoming either a detector or an entry here.
 * That's what keeps this list from going stale silently.
 */
export const NOT_DETECTED = [
	{
		item: 4,
		reason:
			'"decorative section numbering that carries no sequence" depends on whether the numbering carries sequence — and "1." in an ordered list of steps does. Distinguishing the two is judgment: left to the critic.'
	},
	{
		item: 5,
		reason:
			'"card inside a card" needs the rendered tree with CSS applied; there\'s no way to tell what\'s a card from component text alone. Left to the critic.'
	},
	{
		item: 7,
		reason:
			'`calc(33% - 1rem)` in flex is only a finding when a Grid alternative exists for THAT layout. Without the render, the rule would reject legitimate percentage use.'
	},
	{
		item: 16,
		reason:
			'"a zero-offset colored halo" is `box-shadow: 0 0 …` — which is exactly the shape of a legitimate focus ring. Telling the two apart needs to know whether the selector is `:focus-visible`, and the rule would end up more fragile than useful.'
	},
	{
		item: 17,
		reason:
			'"hairline border AND wide shadow on the same element" needs the cascade resolved (the two can come from different selectors). Resolving the cascade is render work, left to the critic.'
	},
	{
		item: 19,
		reason:
			'"thick colored stripe" depends on the element being a card/callout/alert, which is a semantic role, not text. Left to the critic.'
	},
	{
		item: 20,
		reason:
			'emoji standing in for an icon: legitimate emoji can appear elsewhere in copy or in code comments. A blind grep would flag both. Left to the critic.'
	},
	{
		item: 21,
		reason:
			'"icons from different families" only checks out against an icon inventory, which this generic core doesn\'t ship. Becomes a detector once a profile\'s first icon exists.'
	},
	{
		item: 29,
		reason:
			'"neutral gray over a colored background" needs resolving which color sits under which text — computed contrast, which is what the accessibility gate (axe) measures, not a grep.'
	},
	{
		item: 30,
		reason:
			'literal color instead of a token: better covered by the active profile\'s stylelint config once wired, which parses CSS with no text false positive.'
	},
	{
		item: 31,
		reason:
			'contrast below WCAG AA: covered by the accessibility gate (axe `color-contrast`, critical/serious), which measures the render instead of guessing from text.'
	},
	{
		item: 37,
		reason:
			'"a whole screen at 400/500 weight" is a property of the SCREEN, not a line: only knowable by summing what actually rendered. Left to the critic.'
	},
	{
		item: 38,
		reason:
			'a flattened type scale lives in the token file and is compared against the design contract by a dedicated token test — that\'s the right check, not a component-level grep.'
	},
	{
		item: 39,
		reason:
			'`letter-spacing` beyond the allowed range has no detector yet because no component declares it today; the active profile\'s stylelint config is the right place once one does.'
	},
	{
		item: 40,
		reason:
			'line measure in the 45-75 character range is a render measurement (container width / glyph width). Checking the result is left to the critic.'
	},
	{
		item: 41,
		reason:
			'body below 16px / UI below 14px: covered by the active profile\'s stylelint config, which only accepts `font-size: var(--text-*)` from a scale with no step that small.'
	},
	{
		item: 42,
		reason:
			'all-caps in running text: `text-transform: uppercase` is legitimate on a short label; telling a label from running text apart is judgment. Left to the critic.'
	},
	{
		item: 43,
		reason:
			'a skipped heading level needs the assembled document tree (an `h2` can come from a layout and an `h4` from the route). That\'s the accessibility gate\'s `heading-order` check.'
	},
	{
		item: 44,
		reason: 'a literal `font-size` outside the scale: covered by the active profile\'s stylelint config, with a CSS parser.'
	},
	{
		item: 48,
		reason:
			'a default hover `scale`/`translateY` "applied to everything clickable" — the finding is the UNIVERSALITY, not the existence. Counting how many clickable selectors get a hover is cascade analysis. Left to the critic.'
	},
	{
		item: 49,
		reason:
			'a missing `prefers-reduced-motion` block where animation exists is detectable, but no component animates yet. Becomes a detector on the first `@keyframes`/`transition` the product ships — building it now would be a gate with no surface.'
	},
	{
		item: 54,
		reason:
			'an image that scales/rotates on hover needs matching the hover selector to an image element across the cascade. Left to the critic.'
	},
	{
		item: 56,
		reason:
			'`placeholder` used as a label needs to know whether a `<label>` is associated with the field — a tree relationship, not text. That\'s the accessibility gate\'s `label` check.'
	},
	{
		item: 69,
		reason:
			'an em dash as a default punctuation habit: the rule itself declares narrative prose as an exception, and a grep would reject correct copy — the worst failure mode for a deterministic gate. Left to the critic.'
	}
];

/** Item 26: the gradient's ramp has a color in the purple/violet arc AND one in the cyan/turquoise arc. */
function purpleCyanGradient(/** @type {string} */ snippet) {
	const purple =
		/\b(purple|violet|indigo|orchid|magenta|fuchsia|blueviolet|rebeccapurple)\b|#(6|7|8|9|a|b)[0-9a-f]{1}[0-9a-f]{2}(e|f)[0-9a-f]|hsl\(\s*2[5-9]\d/i;
	const cyan =
		/\b(cyan|aqua|turquoise|teal|aquamarine|skyblue|lightblue)\b|#[0-9a-f]{2}(d|e|f)[0-9a-f](e|f)[0-9a-f]|hsl\(\s*1[6-9]\d/i;
	return purple.test(snippet) && cyan.test(snippet);
}

/** Item 36: the FIRST family in the stack is the voice. A trailing `system-ui` fallback is legitimate. */
function defaultSystemFontAsVoice(/** @type {string} */ snippet) {
	const value = snippet.replace(/^[^:]*:\s*/, '').trim();
	if (value.startsWith('var(')) return false;
	const first = value
		.split(',')[0]
		.trim()
		.replace(/^['"]|['"]$/g, '')
		.toLowerCase();
	return [
		'inter',
		'roboto',
		'system-ui',
		'-apple-system',
		'blinkmacsystemfont',
		'segoe ui',
		'helvetica',
		'helvetica neue',
		'arial',
		'sans-serif',
		'serif',
		'ui-sans-serif',
		'ui-serif'
	].includes(first);
}

/** Item 47: a cubic-bezier with y outside [0,1] overshoots; the words `bounce`/`elastic`/`back` too. */
function overshootEasing(/** @type {string} */ snippet) {
	const bezier = snippet.match(/cubic-bezier\s*\(([^)]*)\)/i);
	if (!bezier) return true;
	const n = bezier[1].split(',').map((/** @type {string} */ v) => Number(v.trim()));
	if (n.length !== 4 || n.some(Number.isNaN)) return false;
	return n[1] < 0 || n[1] > 1 || n[3] < 0 || n[3] > 1;
}

/** Item 68: `alt` missing, or present and generic. `alt=""` (decorative) is legitimate. */
function missingOrGenericAlt(/** @type {string} */ snippet) {
	const alt = snippet.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/i);
	if (!alt) return true;
	// `alt={expression}` is dynamic content: the value isn't here, and rejecting it would be a guess.
	if (alt[3] !== undefined) return false;
	const value = (alt[1] ?? alt[2] ?? '').trim().toLowerCase();
	if (value === '') return false;
	return ['image', 'photo', 'picture', 'icon', 'logo', 'graphic'].includes(value);
}

/**
 * Blanks out comment CONTENT, preserving position and line breaks.
 *
 * Without this the gate rejects itself: a comment that explains WHY something is or isn't an
 * antipattern can contain the very words a detector looks for — a finding inside a sentence
 * that describes the finding. A comment is where the factory writes WHY something is or isn't
 * an antipattern; scanning it turns documentation into a defect.
 *
 * Every comment character becomes a space (line breaks survive), so every occurrence's index
 * still lines up with its line number. The string heuristic is the minimum that protects the
 * real case: `//` only opens a comment when the previous character isn't `:` (otherwise
 * `https://` would become a comment), and quotes/backticks open a protected region.
 */
export function maskComments(/** @type {string} */ content) {
	const out = content.split('');
	const erase = (/** @type {number} */ from, /** @type {number} */ to) => {
		for (let k = from; k < to && k < out.length; k += 1) {
			if (out[k] !== '\n' && out[k] !== '\r') out[k] = ' ';
		}
	};

	let i = 0;
	let quote = '';
	while (i < content.length) {
		const c = content[i];
		if (quote !== '') {
			if (c === '\\') i += 2;
			else {
				if (c === quote) quote = '';
				i += 1;
			}
			continue;
		}
		if (c === '"' || c === "'" || c === '`') {
			quote = c;
			i += 1;
			continue;
		}
		if (content.startsWith('<!--', i)) {
			const end = content.indexOf('-->', i + 4);
			const to = end === -1 ? content.length : end + 3;
			erase(i, to);
			i = to;
			continue;
		}
		if (content.startsWith('/*', i)) {
			const end = content.indexOf('*/', i + 2);
			const to = end === -1 ? content.length : end + 2;
			erase(i, to);
			i = to;
			continue;
		}
		if (content.startsWith('//', i) && content[i - 1] !== ':') {
			const end = content.indexOf('\n', i);
			const to = end === -1 ? content.length : end;
			erase(i, to);
			i = to;
			continue;
		}
		i += 1;
	}
	return out.join('');
}

/** `antipattern-ok: N -- reason`, in a markup or CSS comment, on the PRECEDING line. */
const SILENCING = /antipattern-ok\s*:\s*(\d+)\s*(?:--\s*(.*?))?\s*(?:-->|\*\/|$)/;

function readSilencing(/** @type {string[]} */ lines) {
	/** @type {Map<number, { item: number, justification: string, commentLine: number, used: boolean }>} */
	const byLine = new Map();
	lines.forEach((line, i) => {
		const m = line.match(SILENCING);
		if (!m) return;
		byLine.set(i + 2, {
			item: Number(m[1]),
			justification: (m[2] || '').trim(),
			commentLine: i + 1,
			used: false
		});
	});
	return byLine;
}

function filesUnder(/** @type {string} */ root) {
	/** @type {string[]} */
	const found = [];
	const visit = (/** @type {string} */ dir) => {
		let entries;
		try {
			entries = readdirSync(dir);
		} catch {
			return;
		}
		for (const entry of entries) {
			if (IGNORED_DIRS.has(entry)) continue;
			const path = join(dir, entry);
			if (statSync(path).isDirectory()) visit(path);
			else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) found.push(path);
		}
	};
	visit(root);
	return found;
}

/**
 * Scans a file and returns its findings. Exported for the test.
 * @param {string} relativePath
 * @param {string} content
 */
export function scan(relativePath, content) {
	const extension = EXTENSIONS.find((ext) => relativePath.endsWith(ext));
	const lines = content.split(/\r?\n/);
	// Silencing is read from the RAW text (it lives in a comment); detectors scan the masked
	// text (a comment isn't UI).
	const silencing = readSilencing(lines);
	const code = maskComments(content);
	const findings = [];

	for (const detector of DETECTORS) {
		if (extension === undefined || !detector.target.includes(extension)) continue;
		detector.regex.lastIndex = 0;
		for (const occurrence of code.matchAll(detector.regex)) {
			const snippet = occurrence[0];
			if (detector.filter && !detector.filter(snippet)) continue;
			// The occurrence's line: how many breaks come before it.
			const line = code.slice(0, occurrence.index ?? 0).split(/\r?\n/).length;
			// A silencing applies to the line where the pattern STARTS.
			const silenced = silencing.get(line);
			if (silenced && silenced.item === detector.item) {
				silenced.used = true;
				if (silenced.justification === '') {
					findings.push(
						finding(
							detector.item,
							'empty-justification',
							'`antipattern-ok` with no justification after `--`. An anonymous exception is itself a finding: write WHY this product wants this.',
							relativePath,
							silenced.commentLine,
							lines[silenced.commentLine - 1] ?? ''
						)
					);
				}
				continue;
			}
			findings.push(
				finding(detector.item, detector.id, detector.message, relativePath, line, snippet)
			);
		}
	}

	// An exception that silences nothing: the residual false positive this pass exists to avoid.
	for (const [, s] of silencing) {
		if (s.used) continue;
		findings.push(
			finding(
				s.item,
				'useless-justification',
				`\`antipattern-ok: ${s.item}\` silences nothing on this line. An exception that survived the fix becomes noise — remove it.`,
				relativePath,
				s.commentLine,
				lines[s.commentLine - 1] ?? ''
			)
		);
	}

	return findings;
}

/** @param {string[]} argv */
function main(argv) {
	if (argv.includes('--list')) {
		for (const d of DETECTORS) console.log(`${String(d.item).padStart(2)}  ${d.id}  ${d.description}`);
		console.log(`\n${DETECTORS.length} detector(s); ${NOT_DETECTED.length} [LINT] item(s) declared with no detector.`);
		return 0;
	}

	const explicit = argv.filter((/** @type {string} */ a) => !a.startsWith('--'));
	const targets = (
		explicit.length > 0 ? explicit : ROOTS.flatMap((root) => filesUnder(root))
	).map((/** @type {string} */ path) => relative(process.cwd(), path).split(sep).join('/'));

	const ignored = new Set(ALLOWLIST_FILES.map((a) => a.path));
	const findings = [];
	for (const path of targets) {
		if (ignored.has(path)) continue;
		findings.push(...scan(path, readFileSync(path, 'utf8')));
	}

	if (findings.length === 0) {
		console.log(
			`Antipatterns [LINT]: no findings in ${targets.length} UI file(s) ` +
				`(${DETECTORS.length} detector(s)).`
		);
		return 0;
	}

	for (const f of findings) {
		console.log(
			`::error file=${f.file},line=${f.line}::antipattern ${f.item} (${f.id}) — ${f.message}\n` +
				`  ${f.file}:${f.line}  ${f.snippet}`
		);
	}
	console.log(
		`\n${findings.length} antipattern finding(s). Fix them, or record the justification at the ` +
			'point of use with `antipattern-ok: <item> -- <why THIS product wants THIS>` ' +
			'(`.claude/rules/design-antipatterns.md`: nothing is absolutely forbidden, but nothing passes without one of the two).'
	);
	return 1;
}

// `import.meta.main` doesn't exist in Node 22: the guard is comparing the module against
// `argv[1]`, via `pathToFileURL`. Without this guard, a test importing `scan`/`NOT_DETECTED`
// would run the whole scan and kill the test process.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	process.exit(main(process.argv.slice(2)));
}
