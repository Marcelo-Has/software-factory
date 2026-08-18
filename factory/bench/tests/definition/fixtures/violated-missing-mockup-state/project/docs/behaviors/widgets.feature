Feature: Widgets

  @scenario:list-widgets @endpoint:listWidgets @happy
  Scenario: List widgets
    Given a widget exists
    When the caller lists widgets
    Then the widget is returned

  @scenario:webhook-happy @endpoint:handlePaymentWebhook @integration:I-payments @happy
  Scenario: Webhook happy path
    Given a "payment.succeeded" event
    When handlePaymentWebhook receives it
    Then the widget is marked paid

  @scenario:webhook-duplicate @integration:I-payments @duplicate
  Scenario: A repeated webhook event is a no-op
    Given the event was already applied
    When handlePaymentWebhook receives the same event again
    Then nothing changes, and the response still reports success

  @scenario:webhook-timeout @integration:I-payments @external-failure
  Scenario: The payment provider is unreachable
    Given the payment provider is about to time out
    When handlePaymentWebhook is called
    Then a clear, generic failure is reported

  @scenario:webhook-invalid @integration:I-payments @invalid
  Scenario: A malformed webhook payload is rejected
    Given a malformed payload
    When handlePaymentWebhook receives it
    Then the request is rejected with a specific reason

  @scenario:webhook-unauthorized @integration:I-payments @unauthorized
  Scenario: A webhook with an invalid signature is denied
    Given an invalid signature
    When handlePaymentWebhook receives it
    Then the request is denied
