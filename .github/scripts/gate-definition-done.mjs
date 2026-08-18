// No shebang: this module is IMPORTED by its own CLI guard below and by tests. See
// gate-design-md.mjs / gate-contracts.mjs for the same convention and why.
/**
 * Deterministic (NON-AI) gate — "Definition Done" (R-INIT, plan §0.4.2). The checklist
 * `/fabric-init` runs before routing the owner to the next pending Definition-phase skill.
 * It never re-implements a check another gate already owns: the DP-3 logical/integration
 * coverage is delegated to `gate-contracts.mjs`'s exported `checkContracts(cwd, {
 * definition: true })`, and every artifact's `Status` header is parsed by
 * `gate-design-md.mjs`'s exported `validate`.
 *
 * Checks, in order:
 *   1. Structure — `project/state/init.json` and the base directories `/init` creates.
 *   2. Per-stage D0-D6 status/waiver from `project/state/definition-status.yaml`.
 *   3. Per-artifact `Status` header (PRODUCT/SPEC/ARCHITECTURE/DATA-MODEL/nfr/MILESTONES/
 *      DESIGN) — present, not a placeholder, `approved` (or the specific artifact is
 *      waived).
 *   4. screens x mockups x `mockup_states` coverage (screens.yaml vs project/design/mockups/).
 *   5. Every screen and every feature belongs to exactly one milestone.
 *   6. DP-3 logical coverage, delegated to `checkContracts`.
 *
 * Output: a pending-items table where every line names the skill that resolves it. Exit 0
 * only when there are zero pending items (everything green or explicitly, exactly waived).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { checkContracts } from './gate-contracts.mjs';
import { validate as validateStatusHeader } from './gate-design-md.mjs';

const STAGE_SKILL = {
	D0: '/init',
	D1: '/define-product',
	D2: '/define-spec',
	D3: '/define-architecture',
	D4: '/design-foundation',
	D5: '/design-mockups',
	D6: '/plan-milestones'
};

const MD_ARTIFACTS = [
	{ stage: 'D1', rel: 'docs/PRODUCT.md' },
	{ stage: 'D2', rel: 'docs/SPEC.md' },
	{ stage: 'D3', rel: 'docs/ARCHITECTURE.md' },
	{ stage: 'D3', rel: 'docs/DATA-MODEL.md' },
	{ stage: 'D3', rel: 'docs/nfr.md' },
	{ stage: 'D6', rel: 'docs/MILESTONES.md' },
	{ stage: 'D4', rel: 'design/DESIGN.md' }
];

const MOCKUP_PLACEHOLDER = 'PLACEHOLDER — remove before instantiating.';
const MOCKUP_MIN_SIZE = 200;

function artifactName(rel) {
	return rel.split('/').pop();
}

/** A pending item is waived when the stage's `waivers[]` carries an entry whose `item`
 *  field exactly equals the artifact's canonical name, with `approved_by` set. Deliberately
 *  strict (see the session's research on the Ledgerline example): a loose, multi-artifact
 *  prose waiver does not silently absorb every artifact it mentions. */
function isWaived(stages, stage, canonicalName) {
	const waivers = stages?.[stage]?.waivers || [];
	return waivers.some((w) => w?.item?.trim() === canonicalName && Boolean(w?.approved_by));
}

function readYamlFile(path) {
	if (!existsSync(path)) return null;
	return parseYaml(readFileSync(path, 'utf8'));
}

export function runDefinitionDone(cwd = process.cwd()) {
	const pendingItems = [];
	const push = (area, message, skill) => pendingItems.push({ area, message, skill });

	const projectDir = join(cwd, 'project');
	const docsDir = join(projectDir, 'docs');
	const initPath = join(projectDir, 'state', 'init.json');
	const defStatusPath = join(projectDir, 'state', 'definition-status.yaml');

	// 1. Structure.
	if (!existsSync(initPath)) {
		push('D0', '`project/state/init.json` does not exist.', '/init');
	}
	for (const dir of ['docs', 'docs/contracts', 'docs/behaviors', 'design/mockups', 'state']) {
		if (!existsSync(join(projectDir, ...dir.split('/')))) {
			push('D0', `\`project/${dir}/\` does not exist.`, '/init');
		}
	}

	// 2. Per-stage status/waiver.
	const defStatus = readYamlFile(defStatusPath);
	if (defStatus === null) {
		push('D0', '`project/state/definition-status.yaml` does not exist.', '/init');
	}
	const stages = defStatus?.stages || {};
	for (const stage of Object.keys(STAGE_SKILL)) {
		const status = stages[stage]?.status;
		if (status !== 'approved' && status !== 'waived') {
			push(
				stage,
				`Stage ${stage} is \`${status ?? 'unrecorded'}\`, not \`approved\` or \`waived\`.`,
				STAGE_SKILL[stage]
			);
		}
	}

	// 3. Per-artifact Status header.
	for (const { stage, rel } of MD_ARTIFACTS) {
		const path = join(projectDir, ...rel.split('/'));
		const name = artifactName(rel);
		if (isWaived(stages, stage, name)) continue;
		if (!existsSync(path)) {
			push(stage, `\`project/${rel}\` does not exist.`, STAGE_SKILL[stage]);
			continue;
		}
		const verdict = validateStatusHeader(readFileSync(path, 'utf8'));
		if (!verdict.ok) {
			push(stage, `\`project/${rel}\` ${verdict.reason}`, STAGE_SKILL[stage]);
		}
	}

	// 4. screens x mockups x mockup_states coverage.
	const screensPath = join(docsDir, 'screens.yaml');
	const screensDoc = readYamlFile(screensPath);
	if (screensDoc === null) {
		push('D2', '`project/docs/screens.yaml` does not exist.', '/define-spec');
	} else {
		const mockupsDir = join(projectDir, 'design', 'mockups');
		for (const screen of screensDoc.screens || []) {
			for (const state of screen.mockup_states || []) {
				const fileName = state === 'default' ? `${screen.id}.html` : `${screen.id}--${state}.html`;
				if (isWaived(stages, 'D5', fileName)) continue;
				const path = join(mockupsDir, fileName);
				if (!existsSync(path)) {
					push('D5', `Mockup \`${fileName}\` does not exist.`, '/design-mockups');
					continue;
				}
				const size = statSync(path).size;
				const content = readFileSync(path, 'utf8');
				if (size < MOCKUP_MIN_SIZE) {
					push('D5', `Mockup \`${fileName}\` is under the minimum size.`, '/design-mockups');
				} else if (content.includes(MOCKUP_PLACEHOLDER)) {
					push('D5', `Mockup \`${fileName}\` is still the unedited template.`, '/design-mockups');
				}
			}
		}
	}

	// 5. screens/features -> exactly one milestone.
	const milestonesPath = join(docsDir, 'milestones.yaml');
	const milestonesDoc = readYamlFile(milestonesPath);
	if (milestonesDoc === null) {
		push('D6', '`project/docs/milestones.yaml` does not exist.', '/plan-milestones');
	} else {
		const milestoneList = milestonesDoc.milestones || [];
		if (screensDoc !== null) {
			const screenCounts = new Map((screensDoc.screens || []).map((s) => [s.id, 0]));
			for (const m of milestoneList) {
				for (const id of m.screens || []) {
					screenCounts.set(id, (screenCounts.get(id) || 0) + 1);
				}
			}
			for (const [id, count] of screenCounts) {
				if (count !== 1) {
					push(
						'D6',
						`Screen \`${id}\` is in ${count} milestone(s) — every screen must be in exactly one.`,
						'/plan-milestones'
					);
				}
			}
		}
		const specPath = join(docsDir, 'SPEC.md');
		if (existsSync(specPath)) {
			const featureIds = [
				...readFileSync(specPath, 'utf8').matchAll(/^####\s+(F-\d+)\s+—/gm)
			].map((m) => m[1]);
			const featureCounts = new Map(featureIds.map((id) => [id, 0]));
			for (const m of milestoneList) {
				for (const id of m.features || []) {
					featureCounts.set(id, (featureCounts.get(id) || 0) + 1);
				}
			}
			for (const [id, count] of featureCounts) {
				if (count !== 1) {
					push(
						'D6',
						`Feature \`${id}\` is in ${count} milestone(s) — every feature must be in exactly one.`,
						'/plan-milestones'
					);
				}
			}
		}
	}

	// 6. DP-3 logical coverage, delegated — never re-implemented.
	const { findings } = checkContracts(cwd);
	for (const f of findings) {
		push('DP-3', f.message, f.skill);
	}

	return { ok: pendingItems.length === 0, pendingItems };
}

function main(cwd = process.cwd()) {
	const { ok, pendingItems } = runDefinitionDone(cwd);
	if (ok) {
		console.log('Definition Done: every stage is approved or waived, and coverage is complete.');
		return 0;
	}
	console.log(`Definition Done — ${pendingItems.length} pending item(s):\n`);
	console.log('| Area | Pending | Skill |');
	console.log('| --- | --- | --- |');
	for (const item of pendingItems) {
		console.log(`| ${item.area} | ${item.message} | ${item.skill} |`);
	}
	return 1;
}

// Importable without side effects (the ui-routes.mjs / lint-antipatterns.mjs lesson): only
// run as a CLI when this file is the actual entry point.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	process.exit(main());
}
