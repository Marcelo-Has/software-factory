# billing-update-plan.feature — Ledgerline
#
# Example artifact for factory/templates/behaviors-template.feature. See the note in
# factory/templates/examples/ledgerline/PRODUCT.md — never copy this content into a real
# product's behaviors/*.feature. Covers F-5 (manage the Pro subscription), the feature that
# crosses the I-payments boundary for subscription billing — all five mandatory classes per
# DECISIONS.md D-007, demonstrated against the update-subscription flow cited as the filled
# example in factory/docs/playbooks/external-integration.md.

Feature: Manage the Pro subscription

  @scenario:upgrade-to-pro @endpoint:upgradeSubscription @happy
  Scenario: Owner upgrades from Free to Pro
    Given an account on the Free plan, owned by "owner@example.com"
    When the owner calls upgradeSubscription
    Then the account's plan becomes "pro"
    And the Free-tier invoice cap is lifted immediately

  @scenario:subscription-webhook-duplicate @integration:I-payments @duplicate
  Scenario: A repeated subscription-update webhook event is a no-op
    Given a "subscription.updated" event with id "evt_1" has already been applied, moving the account to "pro"
    When handlePaymentWebhook receives the same "evt_1" event a second time
    Then the account's plan stays "pro" with no additional change
    And the response still reports success

  @scenario:payment-provider-unavailable @integration:I-payments @external-failure
  Scenario: The payment provider times out during an upgrade attempt
    Given an account on the Free plan
    And I-payments is about to time out on the next call
    When the owner calls upgradeSubscription
    Then the account's plan stays "free", not partially upgraded
    And the owner sees a clear, generic failure message, not the raw provider error

  @scenario:cancel-invalid-state @endpoint:cancelSubscription @invalid
  Scenario: Canceling a subscription that is already on the Free plan is rejected
    Given an account already on the Free plan
    When the owner calls cancelSubscription
    Then the request is rejected
    And the reason names that there is no active Pro subscription to cancel

  @scenario:member-cannot-upgrade @endpoint:upgradeSubscription @unauthorized
  Scenario: A member, not the owner, cannot upgrade the subscription
    Given an account with a "member" role user authenticated, who is not the account owner
    When the member calls upgradeSubscription
    Then the request is denied
    And the account's plan is unchanged, per nfr.md's authorization matrix for upgradeSubscription
