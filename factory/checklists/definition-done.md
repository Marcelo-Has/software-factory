# Definition Done — human checklist

The human mirror of `node .github/scripts/gate-definition-done.mjs` (R-INIT, plan §0.4.2).
The script is the authoritative, re-runnable source of truth — run it any time to see the
real pending list, exactly as `/fabric-init` does before routing to the next skill. This
checklist exists so the same items are legible without running the script, in the same
order the script checks them.

Every unchecked item below names the skill that resolves it. An item covered by an
explicit, owner-approved waiver in `project/state/definition-status.yaml` (item +
justification + `approved_by`) counts as done — a `pending` status never does.

## 1. Structure (D0)

- [ ] `project/state/init.json` exists.
- [ ] `project/docs/`, `project/docs/contracts/`, `project/docs/behaviors/`,
      `project/design/mockups/`, `project/state/` exist.
- [ ] `project/state/definition-status.yaml` exists.

*Skill: `/init`.*

## 2. Per-stage status (D0–D6)

- [ ] Every stage in `project/state/definition-status.yaml` is `approved` or `waived` — never
      `pending`, `in-progress`, or `awaiting-approval`.

*Skill: the stage's own — `/init` (D0), `/define-product` (D1), `/define-spec` (D2),
`/define-architecture` (D3), `/design-foundation` (D4), `/design-mockups` (D5),
`/plan-milestones` (D6).*

## 3. Per-artifact `Status` header

- [ ] `PRODUCT.md`, `SPEC.md`, `ARCHITECTURE.md`, `DATA-MODEL.md`, `nfr.md`,
      `MILESTONES.md`, `DESIGN.md` each exist, are not a placeholder (`[TO FILL IN]`), and
      carry `| **Status** | \`approved\` |` — unless the specific artifact is named, exactly,
      in a waiver with `approved_by` set.

*Skill: the artifact's own stage skill, per the D0–D6 table in `CLAUDE.md`/`FACTORY.md`.*

## 4. Screens x mockups x mockup_states (D5)

- [ ] Every screen in `project/docs/screens.yaml`, for every state in its `mockup_states`,
      has a mockup file (`<screen-id>.html` for `default`, `<screen-id>--<state>.html`
      otherwise) that exists, meets the minimum size, and isn't the unedited template
      (no `PLACEHOLDER — remove before instantiating.` notice) — unless that exact filename
      is named in a D5 waiver with `approved_by` set.

*Skill: `/design-mockups`.*

## 5. Screens/features → exactly one milestone (D6)

- [ ] Every screen id in `screens.yaml` appears in exactly one milestone's `screens[]` in
      `project/docs/milestones.yaml` — never zero, never more than one.
- [ ] Every feature id (`SPEC.md`'s `#### F-<n> —` headings) appears in exactly one
      milestone's `features[]`.

*Skill: `/plan-milestones`.*

## 6. DP-3 logical/integration coverage (delegated to `gate-contracts.mjs --definition`)

- [ ] `project/docs/contracts/openapi.yaml` and `contracts/integrations.yaml` exist and
      aren't placeholders.
- [ ] Every `openapi.yaml` operation has an `operationId`.
- [ ] Every `operationId` has at least one `.feature` scenario tagged
      `@endpoint:<operationId>`.
- [ ] Every integration in `integrations.yaml` has all five mandatory scenario classes
      (`@happy`, `@duplicate`, `@external-failure`, `@invalid`, `@unauthorized`) covered by
      scenarios tagged `@integration:<I-id>`.
- [ ] No malformed scenario (missing both `@endpoint`/`@integration`, or more than one class
      tag) and no orphan tag (naming an id that doesn't exist in its source file).
- [ ] Every endpoint and every integration is listed in at least one milestone.
- [ ] `nfr.md` exists and isn't a placeholder, whenever the product has its own endpoints.

Right-sizing: a product with no own endpoints and no integrations satisfies this section
with `paths: {}` and `integrations: []` — the axis costs nothing further.

*Skill: `/define-architecture` (contracts, `nfr.md`), `/define-spec` (behaviors/scenarios),
`/plan-milestones` (endpoint/integration → milestone coverage).*
