Feature: Widgets

  @scenario:list-widgets @endpoint:listWidgets @happy
  Scenario: List widgets
    Given a widget exists
    When the caller lists widgets
    Then the widget is returned

  @scenario:create-widget @endpoint:createWidget @happy
  Scenario: Create a widget
    Given valid widget data
    When the caller creates a widget
    Then the widget is persisted
