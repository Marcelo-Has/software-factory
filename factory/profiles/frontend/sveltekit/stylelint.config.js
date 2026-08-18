/**
 * Tokens-compliance gate (raw material — see this directory's README).
 *
 * What it decides: a hand-written design value in a component REJECTS. Color, spacing,
 * radius, elevation, type family/size/weight, and motion only enter the UI through
 * `var(--token)` from the system declared in the approved `project/design/DESIGN.md` and
 * transcribed into the product's `tokens.css`. This is the deterministic half of the design
 * gate — the critic judges whether the palette is *right*; this gate only guarantees it comes
 * from the *right place*, without spending an AI turn on it.
 *
 * THE ALLOWLIST IS EXPLICIT AND HAS TWO FORMS, both auditable:
 *
 *   1. the product's `tokens.css` file — the only FILE EXCEPTION, in the `overrides` at the
 *      end. That's where the literals live by definition; without it the rule would be
 *      circular.
 *   2. a `stylelint-disable-next-line <rule> -- <justification>` comment at the point of use —
 *      the pointed exception. `reportDescriptionlessDisables` turns a disable with no `--` and
 *      reason into an ERROR: there is no anonymous exception. And `reportNeedlessDisables`
 *      turns an exception that no longer silences anything into an ERROR too — that's what
 *      stops the residual false positive: an old exception doesn't outlive the fix that made
 *      it unnecessary.
 *
 * LITERALS ARE NOT BANNED OUTRIGHT, and that's a decision, not an oversight: `currentColor`,
 * `transparent`, `inherit`, and `none` carry no color decision — they delegate it. Banning them
 * would push the UI to write a token exactly where it correctly chooses nothing today.
 *
 * WHAT THIS GATE DOES NOT COVER, on purpose (right-sizing): a component's `width`/`height`/
 * `max-width`. The spacing scale is for GAPS, not dimensions — a component's own thumbnail size
 * doesn't have a token and shouldn't get one invented just to satisfy a lint rule. Component
 * dimension is a composition judgment call, and that's the design critic's job.
 */

/** A literal color in any property: hex, a color function, and the named color keywords. */
const LITERAL_COLORS = [
	'/#[0-9a-fA-F]{3,8}\\b/',
	'/\\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\\(/',
	'/\\b(aqua|black|blue|fuchsia|gray|grey|green|lime|maroon|navy|olive|purple|red|silver|teal|white|yellow|orange|pink|brown|beige|ivory|cyan|magenta|gold|indigo|violet|crimson|salmon|khaki|lavender|turquoise|tomato|wheat|plum|orchid|coral)\\b/'
];

/** The properties whose value is SPACING — and therefore comes from the spacing scale. */
const SPACING_PROPERTIES =
	'/^(margin|padding|gap|row-gap|column-gap|inset)(-(top|right|bottom|left|inline|block))?(-(start|end))?$/';

/** `0`, `auto`, and `var(--space-*)` — nothing else. Unitless `0` isn't a scale choice. */
const ALLOWED_SPACING = ['/^((0|auto|var\\(--space-[a-z0-9-]+\\))(\\s+|$))+$/'];

export default {
	// No anonymous exception and no zombie exception. These two lines are what makes this
	// gate's allowlist auditable instead of decorative.
	reportDescriptionlessDisables: true,
	reportNeedlessDisables: true,
	reportInvalidScopeDisables: true,

	ignoreFiles: [
		'build/**',
		'.svelte-kit/**',
		'.netlify/**',
		'dist/**',
		'node_modules/**',
		'playwright-report/**',
		'test-results/**',
		'artifacts/**'
		// `factory/bench/tests/design/fixtures/` is NOT here on purpose: those are planted
		// violations, and `factory/bench/tests/design/style.test.ts` runs stylelint AGAINST
		// them to prove this gate rejects. Ignoring them would remove exactly the proof. They
		// stay outside a product's own `lint` script because that script is scoped to the
		// product's source tree, not because this config hides them.
	],

	rules: {
		// A literal color in a component, in ANY property (including inside a shorthand like
		// `border: 1px solid #fff`).
		'declaration-property-value-disallowed-list': {
			'/.*/': LITERAL_COLORS
		},

		'declaration-property-value-allowed-list': {
			// The spacing scale.
			[SPACING_PROPERTIES]: ALLOWED_SPACING,

			// Radius. Adjust the allowed step names to the active DESIGN.md's own scale.
			'border-radius': ['/^(0|var\\(--radius-(sm|md|full)\\))$/'],

			// Elevation. A hand-written shadow is the layered/multi-shadow antipattern by the
			// back door.
			'box-shadow': ['/^(none|var\\(--elevation-[0-2]\\))$/'],

			// Typography. Family, size, and weight are declared roles, not raw values.
			'font-family': ['/^var\\(--font-(book|system)\\)$/', 'inherit'],
			'font-size': ['/^var\\(--text-[a-z0-9]+\\)$/', 'inherit'],
			'font-weight': ['/^var\\(--weight-[a-z]+\\)$/', 'inherit'],

			// Motion. Duration and easing come from the contract; the browser's own
			// `ease`/`linear` don't.
			'transition-duration': ['/^var\\(--duration-[a-z]+\\)$/'],
			'animation-duration': ['/^var\\(--duration-[a-z]+\\)$/'],
			'transition-timing-function': ['/^var\\(--ease-[a-z]+\\)$/'],
			'animation-timing-function': ['/^var\\(--ease-[a-z]+\\)$/']
		}
	},

	overrides: [
		{
			// `postcss-html` is what teaches stylelint to find the `<style>` block inside a
			// `.svelte` file. It lives HERE, scoped by extension, and not at the top of the
			// config: at the top it would also apply to `.css`, and then stylelint would look
			// for a `<style>` tag inside a file that has none — find no CSS, report nothing,
			// and the gate would go **green across the board**. Only the planted violations in
			// `factory/bench/tests/design/style.test.ts` surface this if it regresses: the gate
			// would reject `.svelte` and silently ignore `.css`, which is the worst way for a
			// gate to be broken.
			files: ['**/*.svelte', '**/*.html'],
			customSyntax: 'postcss-html'
		},
		{
			// THE FILE EXCEPTION — the only one. Here the literals are the file's product.
			files: ['app/web/src/lib/styles/tokens.css'],
			rules: {
				'declaration-property-value-disallowed-list': null,
				'declaration-property-value-allowed-list': null
			}
		}
	]
};
