# behaviors-template.feature — template
#
# How to instantiate
# Copy to project/docs/behaviors/<feature-area>.feature — one file per product feature area,
# not one giant file. Built in D3 (/define-architecture), once contracts/openapi.yaml exists
# to tag scenarios against; D2 (/define-spec) is where SPEC.md declares which flows need
# scenarios in the first place. Convention (DECISIONS.md D-009 §2, D-007):
#
#   @scenario:<slug>          a short, stable, kebab-case id for this scenario. Never reuse a
#                              retired slug for a different scenario later.
#   @endpoint:<operationId>   the operationId (from contracts/openapi.yaml) this scenario
#                              exercises. Use when the scenario is scoped to one endpoint.
#   @integration:<I-id>       the integration id (from contracts/integrations.yaml) this
#                              scenario exercises. Use when the scenario crosses an external
#                              boundary — a scenario can carry both an @endpoint and an
#                              @integration tag when the endpoint IS the integration boundary
#                              (e.g. a webhook handler).
#   exactly one class tag:    @happy | @duplicate | @external-failure | @invalid |
#                              @unauthorized
#
# A scenario with neither an @endpoint nor an @integration tag, or with more than one class
# tag, is malformed — gate-contracts.mjs rejects it. A scenario whose @endpoint or
# @integration tag names an id that doesn't exist in its source file is an orphan — also
# rejected (DECISIONS.md D-009 §2).
#
# DECISIONS.md D-007: every integration ships behavior coverage for all five mandatory
# classes, not just the happy path. This template demonstrates all five so a new .feature
# file has a working shape to copy from, not just a description of the rule.

Feature: [TO FILL IN — feature name, matches one feature area from SPEC.md]

  # @happy — the primary, expected-input path. What the feature promises when everything
  # goes right: valid input, an authorized caller, a healthy external dependency.
  @scenario:<slug> @endpoint:<operationId> @happy
  Scenario: [TO FILL IN — descriptive title, what happens, not "happy path"]
    Given [TO FILL IN — a precondition that sets up the expected-input case]
    When [TO FILL IN — the caller takes the action]
    Then [TO FILL IN — the observable, expected outcome]

  # @duplicate — mandatory whenever @integration is present (DECISIONS.md D-007): a retried
  # or re-delivered event/request is a no-op the second time, never a double effect (double
  # charge, double email, double state transition).
  @scenario:<slug> @integration:<I-id> @duplicate
  Scenario: [TO FILL IN — descriptive title]
    Given [TO FILL IN — the event/request has already been processed once, successfully]
    When [TO FILL IN — the same event/request is delivered again, unchanged]
    Then [TO FILL IN — the second delivery has no additional effect, and still reports success]

  # @external-failure — the external dependency errors, times out, or returns a payload the
  # integration doesn't recognize. The product degrades legibly (a named error state, a
  # retry path, a support-visible log) — never silently, and never by leaking the raw
  # provider error to the caller.
  @scenario:<slug> @integration:<I-id> @external-failure
  Scenario: [TO FILL IN — descriptive title]
    Given [TO FILL IN — the external dependency is about to fail: error, timeout, or malformed payload]
    When [TO FILL IN — the caller takes the action]
    Then [TO FILL IN — the product reports a clear, generic failure and leaves no inconsistent state behind]

  # @invalid — malformed or out-of-range input is rejected with a specific, actionable
  # reason. Never silently accepted, never silently corrected.
  @scenario:<slug> @endpoint:<operationId> @invalid
  Scenario: [TO FILL IN — descriptive title]
    Given [TO FILL IN — a caller with valid authorization]
    When [TO FILL IN — the caller submits input that violates a stated validation rule]
    Then [TO FILL IN — the request is rejected and the reason names the violated rule]

  # @unauthorized — an unauthenticated or under-privileged caller is denied, matching
  # nfr.md's authorization matrix exactly (route x role). Never a silent partial success.
  @scenario:<slug> @endpoint:<operationId> @unauthorized
  Scenario: [TO FILL IN — descriptive title]
    Given [TO FILL IN — a caller who is unauthenticated, or authenticated without the required role]
    When [TO FILL IN — the caller attempts the action]
    Then [TO FILL IN — the request is denied, per nfr.md's authorization matrix for this operationId]
